using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;

namespace QLBN.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize] // Yêu cầu đăng nhập chung cho toàn bộ Controller
[Tags("Orders")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public OrdersController(AppDbContext db) => _db = db;

    /// <summary>Lấy tất cả hóa đơn (Chỉ Admin)</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Orders.Include(o => o.Customer).OrderByDescending(o => o.OrderDate).ToListAsync());

    /// <summary>Lấy hóa đơn của user hiện tại</summary>
    [HttpGet("me")]
    [Authorize] // Bất kỳ user hiện tại
    public async Task<IActionResult> GetMyOrders()
    {
        var customerIdClaim = User.Claims.FirstOrDefault(c => c.Type == "customer_id");
        if (customerIdClaim == null)
            return Unauthorized(new { message = "Không có thông tin người dùng." });

        if (!int.TryParse(customerIdClaim.Value, out var customerId))
            return Unauthorized(new { message = "customer_id không hợp lệ." });

        var orders = await _db.Orders
            .Where(o => o.CustomerId == customerId)
            .Include(o => o.OrderDetails).ThenInclude(d => d.Product)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>Lấy chi tiết hóa đơn kèm danh sách sản phẩm (Bất kỳ user nào đăng nhập)</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.OrderDetails).ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(o => o.OrderId == id);
        return order == null ? NotFound(new { message = "Không tìm thấy hóa đơn." }) : Ok(order);
    }

    /// <summary>Tạo đơn hàng mới (Bất kỳ user nào đăng nhập)</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
    {
        var totalAmount = dto.Items.Sum(i => i.Quantity * i.PriceAtPurchase);
        var order = new Order 
        { 
            CustomerId = dto.CustomerId, 
            TotalAmount = totalAmount,
            RecipientName = dto.RecipientName,
            RecipientPhone = dto.RecipientPhone,
            ShippingAddress = dto.ShippingAddress,
            City = dto.City,
            District = dto.District,
            ShippingMethod = dto.ShippingMethod,
            PaymentMethod = dto.PaymentMethod
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        foreach (var item in dto.Items)
        {
            _db.Order_Details.Add(new OrderDetail
            {
                OrderId = order.OrderId,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                PriceAtPurchase = item.PriceAtPurchase
            });
        }
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = order.OrderId }, new { order.OrderId, order.TotalAmount });
    }

    /// <summary>Cập nhật trạng thái đơn hàng (Chỉ Admin)</summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatusDto dto)
    {
        var validStatuses = new[] { "Pending", "Processing", "Delivered", "Cancelled" };
        if (!validStatuses.Contains(dto.Status))
            return BadRequest(new { message = $"Trạng thái không hợp lệ. Chọn: {string.Join(", ", validStatuses)}" });

        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "Không tìm thấy hóa đơn." });

        order.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật trạng thái thành công!" });
    }

    /// <summary>Xóa hóa đơn (Chỉ Admin)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "Không tìm thấy hóa đơn." });
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa hóa đơn thành công!" });
    }
}