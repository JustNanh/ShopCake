using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;
using System.Security.Cryptography;
using System.Text;
using QRCoder;

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

    /// <summary>Khởi tạo giao dịch thanh toán (Hỗ trợ Momo, Banking)</summary>
    [HttpPost("init"), Authorize]
    public async Task<IActionResult> InitTransaction([FromBody] PaymentInitDto dto)
    {
        var order = await _db.Orders.Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderId == dto.OrderId);
        
        if (order == null)
            return NotFound(new { message = "Không tìm thấy đơn hàng." });

        if (order.Status == "Cancelled")
            return BadRequest(new { message = "Không thể thanh toán cho đơn hàng đã hủy." });

        var paymentMethod = dto.PaymentMethod.ToLower();
        
        // Kiểm tra phương thức thanh toán hợp lệ
        var validMethods = new[] { "banking", "banktransfer", "momo" };
        if (!validMethods.Contains(paymentMethod))
        {
            return BadRequest(new { message = "Phương thức thanh toán không hỗ trợ. Chỉ hỗ trợ: Banking, Momo" });
        }

        // Tạo Payment record
        var payment = new Payment
        {
            OrderId = order.OrderId,
            Amount = order.TotalAmount,
            PaymentMethod = dto.PaymentMethod, 
            PaymentDate = DateTime.Now
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // Trả về thành công cho cả Banking và Momo
        return Ok(new
        {
            message = "Khởi tạo thanh toán thành công!",
            paymentId = payment.PaymentId,
            paymentMethod = dto.PaymentMethod
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

    /// <summary>Xác nhận thanh toán hoàn tất (Cập nhật Order status)</summary>
    [HttpPost("{paymentId}/confirm"), Authorize]
    public async Task<IActionResult> ConfirmPayment(int paymentId)
    {
        var payment = await _db.Payments.Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        
        if (payment == null)
            return NotFound(new { message = "Không tìm thấy giao dịch." });

        var order = payment.Order;
        if (order == null)
            return BadRequest(new { message = "Không tìm thấy đơn hàng liên kết." });

        // Ngăn confirm lại nếu đã xử lý
        if (order.Status != "Pending")
            return BadRequest(new { message = $"Đơn hàng đã ở trạng thái '{order.Status}', không thể confirm thanh toán." });

        // Cập nhật trạng thái đơn hàng thành "Processing"
        order.Status = "Processing";
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Thanh toán đã được xác nhận! Đơn hàng đang được xử lý.",
            paymentId = payment.PaymentId,
            orderId = order.OrderId,
            newStatus = order.Status
        });
    }





    // ─── Hàm hỗ trợ ───
    
    private string CreateSHA256(string data)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(data);
        var hash = sha256.ComputeHash(bytes);
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}

// ─── DTOs ───
public record PaymentInitDto(int OrderId, string PaymentMethod); // Banking, Momo