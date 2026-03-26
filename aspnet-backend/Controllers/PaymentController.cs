using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace QLBN.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Tags("Payments")]
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClient;

    public PaymentController(AppDbContext db, IHttpClientFactory httpClient)
    {
        _db = db;
        _httpClient = httpClient;
    }

    /// <summary>Khởi tạo giao dịch thanh toán (Hỗ trợ VNPay, Momo, Zalopay)</summary>
    [HttpPost("init"), Authorize]
    public async Task<IActionResult> InitTransaction([FromBody] PaymentInitDto dto)
    {
        var order = await _db.Orders.Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderId == dto.OrderId);
        
        if (order == null)
            return NotFound(new { message = "Không tìm thấy đơn hàng." });

        if (order.Status == "Cancelled")
            return BadRequest(new { message = "Không thể thanh toán cho đơn hàng đã hủy." });

        // Tạo Payment record
        var payment = new Payment
        {
            OrderId = order.OrderId,
            Amount = order.TotalAmount,
            PaymentMethod = dto.PaymentMethod, // VNPay, Momo, Zalopay
            PaymentDate = DateTime.Now
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // Tạo URL thanh toán dựa trên phương thức
        var paymentUrl = dto.PaymentMethod switch
        {
            "VNPay" => GenerateVNPayUrl(order, payment),
            "Momo" => GenerateMomoUrl(order, payment),
            "Zalopay" => GenerateZaloPayUrl(order, payment),
            _ => throw new ArgumentException("Phương thức thanh toán không hợp lệ")
        };

        return Ok(new
        {
            message = "Khởi tạo giao dịch thành công!",
            paymentId = payment.PaymentId,
            paymentUrl = paymentUrl,
            qrCode = GenerateQRCode(order.OrderId, order.TotalAmount, dto.PaymentMethod)
        });
    }

    /// <summary>Kiểm tra trạng thái thanh toán</summary>
    [HttpGet("{paymentId}/status"), Authorize]
    public async Task<IActionResult> GetPaymentStatus(int paymentId)
    {
        var payment = await _db.Payments.Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        
        if (payment == null)
            return NotFound(new { message = "Không tìm thấy giao dịch." });

        return Ok(new
        {
            paymentId = payment.PaymentId,
            orderId = payment.OrderId,
            amount = payment.Amount,
            paymentMethod = payment.PaymentMethod,
            status = payment.Order?.Status ?? "Unknown",
            paymentDate = payment.PaymentDate
        });
    }

    /// <summary>Callback từ VNPay (chỉ backend)</summary>
    [HttpGet("vnpay/callback")]
    public async Task<IActionResult> VNPayCallback([FromQuery] string vnp_TransactionNo, [FromQuery] string vnp_ResponseCode, [FromQuery] string vnp_OrderInfo)
    {
        if (vnp_ResponseCode == "00") // Thành công
        {
            var orderId = int.Parse(vnp_OrderInfo.Split("|")[0]);
            var order = await _db.Orders.FindAsync(orderId);
            if (order != null)
            {
                order.Status = "Processing";
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Thanh toán VNPay thành công!" });
        }
        return BadRequest(new { message = "Thanh toán VNPay thất bại!" });
    }

    /// <summary>Callback từ Momo</summary>
    [HttpPost("momo/callback")]
    public async Task<IActionResult> MomoCallback([FromBody] MomoCallbackDto dto)
    {
        if (dto.resultCode == 0) // Thành công
        {
            var orderId = int.Parse(dto.orderId);
            var order = await _db.Orders.FindAsync(orderId);
            if (order != null)
            {
                order.Status = "Processing";
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Cảm ơn bạn thanh toán qua Momo!" });
        }
        return BadRequest(new { message = "Thanh toán Momo thất bại!" });
    }

    // ─── Hàm hỗ trợ ───
    
    private string GenerateVNPayUrl(Order order, Payment payment)
    {
        // Giả lập URL VNPay - cần thay bằng API thực tế
        var vnpayUrl = "https://sandbox.vnpayment.vn/paygate/pay.html?";
        var requestId = $"{order.OrderId}_{DateTime.Now.Ticks}";
        
        var parameters = new Dictionary<string, string>
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", "YOUR_VNPAY_MERCHANT_CODE" }, // Thay bằng code thực
            { "vnp_Amount", ((long)(order.TotalAmount * 100)).ToString() },
            { "vnp_CurrCode", "VND" },
            { "vnp_TxnRef", requestId },
            { "vnp_OrderInfo", $"{order.OrderId}|{order.Customer?.FullName}" },
            { "vnp_Locale", "vn" },
            { "vnp_ReturnUrl", "http://localhost:3000/checkout/vnpay-return" }
        };

        var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={p.Value}"));
        return vnpayUrl + queryString;
    }

    private string GenerateMomoUrl(Order order, Payment payment)
    {
        // Giả lập URL Momo - cần thay bằng API thực tế
        var momoUrl = "https://test-payment.momo.vn/web/index.html?";
        
        var parameters = new Dictionary<string, string>
        {
            { "partnerCode", "MOMO_PARTNER_CODE" }, // Thay bằng code thực
            { "orderId", order.OrderId.ToString() },
            { "orderInfo", $"Thanh toán đơn hàng #{order.OrderId}" },
            { "amount", order.TotalAmount.ToString() },
            { "currency", "VND" },
            { "returnUrl", "http://localhost:3000/checkout/momo-return" }
        };

        var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={p.Value}"));
        return momoUrl + queryString;
    }

    private string GenerateZaloPayUrl(Order order, Payment payment)
    {
        // Giả lập URL Zalopay - cần thay bằng API thực tế
        var zaloUrl = "https://sandbox.zalopay.com.vn/api/v2/create";
        return $"{zaloUrl}?app_id=YOUR_ZALOPAY_APP_ID&order_id={order.OrderId}"; // Thay bằng credentials thực
    }

    private string GenerateQRCode(int orderId, decimal amount, string paymentMethod)
    {
        // Tạo chuỗi QR code
        var qrText = $"SHOPcake|{orderId}|{amount}|{paymentMethod}|{DateTime.Now:yyyyMMddHHmmss}";
        
        // Đây là base64 encoded QR (giả lập)
        // Trong thực tế, dùng QRCoder library:
        // using QRCoder;
        // var qrGenerator = new QRCodeGenerator();
        // var qrCodeData = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q);
        // var qrCode = new PngByteQRCode(qrCodeData);
        // var qrCodeImage = qrCode.GetGraphic(20);
        // return Convert.ToBase64String(qrCodeImage);
        
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(qrText));
    }
}

// ─── DTOs ───
public record PaymentInitDto(int OrderId, string PaymentMethod); // VNPay, Momo, Zalopay
public record MomoCallbackDto(string orderId, int resultCode, string message, string transId);
