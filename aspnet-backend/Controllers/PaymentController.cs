using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;
using System.Linq;

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

        // Trả về thành công cho Banking, Momo và các phương thức nội bộ khác
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

    /// <summary>Tạo checkout form cho Sepay Payment Gateway</summary>
    [HttpPost("sepay-pg/checkout"), Authorize]
    public async Task<IActionResult> CreateSepayPgCheckout([FromBody] object dto)
    {
        return NotFound(new { message = "Sepay Payment Gateway đã bị xóa. Vui lòng sử dụng Banking hoặc Momo." });
    }


    private string GenerateSepayPgSignature(Dictionary<string, string> formFields, string secretKey)
    {
        // DEPRECATED: Sepay Payment Gateway has been removed
        return string.Empty;
    }

    /// <summary>Xử lý callback từ Sepay PG (webhook) - DEPRECATED</summary>
    [HttpPost("sepay-pg/callback")]
    public async Task<IActionResult> SepayPgCallback([FromForm] object callback)
    {
        return NotFound(new { success = false, message = "Sepay Payment Gateway đã bị xóa." });
    }

    private bool VerifySepayPgSignature(object callback, string secretKey)
    {
        // DEPRECATED: Sepay Payment Gateway has been removed
        return false;
    }



}

// ─── DTOs ───
public record PaymentInitDto(int OrderId, string PaymentMethod); // Banking, Momo