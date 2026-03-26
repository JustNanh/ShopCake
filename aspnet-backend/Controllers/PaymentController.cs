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
    private readonly IConfiguration _config;

    public PaymentController(AppDbContext db, IHttpClientFactory httpClient, IConfiguration config)
    {
        _db = db;
        _httpClient = httpClient;
        _config = config;
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
        var vnpayConfig = _config.GetSection("Payment:VNPay");
        var vnpayUrl = vnpayConfig["Url"];
        var tmnCode = vnpayConfig["TmnCode"];
        var hashSecret = vnpayConfig["HashSecret"];
        var returnUrl = vnpayConfig["ReturnUrl"];

        var requestId = $"{order.OrderId}_{DateTime.Now.Ticks}";
        
        var parameters = new Dictionary<string, string>
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", tmnCode },
            { "vnp_Amount", ((long)(order.TotalAmount * 100)).ToString() },
            { "vnp_CurrCode", "VND" },
            { "vnp_TxnRef", requestId },
            { "vnp_OrderInfo", $"{order.OrderId}|{order.Customer?.FullName}" },
            { "vnp_OrderType", "other" },
            { "vnp_Locale", "vn" },
            { "vnp_ReturnUrl", returnUrl },
            { "vnp_IpAddr", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1" },
            { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") }
        };

        // Tạo secure hash
        var hashData = string.Join("&", parameters.OrderBy(p => p.Key).Select(p => $"{p.Key}={p.Value}"));
        var secureHash = CreateSHA256(hashData + hashSecret);
        parameters.Add("vnp_SecureHash", secureHash);

        var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));
        return vnpayUrl + "?" + queryString;
    }

    private string GenerateMomoUrl(Order order, Payment payment)
    {
        var momoConfig = _config.GetSection("Payment:Momo");
        var partnerCode = momoConfig["PartnerCode"];
        var accessKey = momoConfig["AccessKey"];
        var secretKey = momoConfig["SecretKey"];
        var momoUrl = momoConfig["Url"];
        var returnUrl = momoConfig["ReturnUrl"];

        var requestId = $"{order.OrderId}_{DateTime.Now.Ticks}";
        var orderInfo = $"Thanh toán đơn hàng #{order.OrderId}";
        var amount = ((long)order.TotalAmount).ToString();
        
        var rawHash = $"partnerCode={partnerCode}&accessKey={accessKey}&requestId={requestId}&amount={amount}&orderId={order.OrderId}&orderInfo={orderInfo}&returnUrl={returnUrl}&notifyUrl={returnUrl}&extraData=";
        var signature = CreateSHA256(rawHash + secretKey);

        var parameters = new Dictionary<string, string>
        {
            { "partnerCode", partnerCode },
            { "accessKey", accessKey },
            { "requestId", requestId },
            { "amount", amount },
            { "orderId", order.OrderId.ToString() },
            { "orderInfo", orderInfo },
            { "returnUrl", returnUrl },
            { "notifyUrl", returnUrl },
            { "requestType", "captureMoMoWallet" },
            { "signature", signature }
        };

        var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));
        return momoUrl + "?" + queryString;
    }

    private string GenerateZaloPayUrl(Order order, Payment payment)
    {
        var zalopayConfig = _config.GetSection("Payment:ZaloPay");
        var appId = zalopayConfig["AppId"];
        var key1 = zalopayConfig["Key1"];
        var zaloUrl = zalopayConfig["Url"];

        var embedData = "{}";
        var items = "[]";
        var transId = DateTime.Now.Ticks.ToString();
        var amount = ((long)order.TotalAmount).ToString();
        
        var data = $"{appId}|{order.OrderId}|{amount}|{transId}|{embedData}|{items}";
        var mac = CreateSHA256(data + key1);

        var parameters = new Dictionary<string, string>
        {
            { "app_id", appId },
            { "app_trans_id", transId },
            { "app_time", ((DateTimeOffset)DateTime.Now).ToUnixTimeMilliseconds().ToString() },
            { "app_user", order.Customer?.FullName ?? "Guest" },
            { "amount", amount },
            { "item", items },
            { "embed_data", embedData },
            { "description", $"Thanh toán đơn hàng #{order.OrderId}" },
            { "bank_code", "" },
            { "mac", mac }
        };

        return zaloUrl;
    }

    private string CreateSHA256(string data)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(data);
        var hash = sha256.ComputeHash(bytes);
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}

// ─── DTOs ───
public record PaymentInitDto(int OrderId, string PaymentMethod); // VNPay, Momo, Zalopay
public record MomoCallbackDto(string orderId, int resultCode, string message, string transId);
