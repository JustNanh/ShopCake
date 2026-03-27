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
        var order = await _db.Orders
            .Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null) return NotFound(new { message = "Không tìm thấy hóa đơn." });

        if (order.OrderDetails.Any())
            _db.Order_Details.RemoveRange(order.OrderDetails);

        var payments = await _db.Payments.Where(p => p.OrderId == id).ToListAsync();
        if (payments.Any())
            _db.Payments.RemoveRange(payments);

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa hóa đơn thành công!" });
    }

    // =========================================================
    // THÊM MỚI TỪ ĐÂY
    // =========================================================

    /// <summary>Xóa đơn hàng của user hiện tại (Chỉ được xóa đơn Pending)</summary>
    [HttpDelete("me/{id}")]
    [Authorize] // Bất kỳ user nào đăng nhập cũng được dùng
    public async Task<IActionResult> DeleteMyOrder(int id)
    {
        var customerIdClaim = User.Claims.FirstOrDefault(c => c.Type == "customer_id");
        if (customerIdClaim == null || !int.TryParse(customerIdClaim.Value, out var customerId))
            return Unauthorized(new { message = "Không có thông tin người dùng." });

        // Tìm hóa đơn và kiểm tra xem hóa đơn này có phải của user đang đăng nhập không
        var order = await _db.Orders
            .Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderId == id && o.CustomerId == customerId);

        if (order == null) return NotFound(new { message = "Không tìm thấy hóa đơn của bạn." });

        // Chỉ cho phép xóa đơn hàng đang chờ xử lý
        if (order.Status != "Pending")
            return BadRequest(new { message = "Bạn chỉ có thể xóa đơn hàng đang chờ xử lý." });

        // Xóa chi tiết đơn hàng
        if (order.OrderDetails.Any())
            _db.Order_Details.RemoveRange(order.OrderDetails);

        // Xóa payment liên quan nếu có
        var payments = await _db.Payments.Where(p => p.OrderId == id).ToListAsync();
        if (payments.Any())
            _db.Payments.RemoveRange(payments);

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã hủy và xóa đơn hàng thành công!" });
    }

    /// <summary>Xóa toàn bộ lịch sử đơn hàng (Chỉ Admin) - KHÔNG làm reset ID</summary>
    [HttpDelete("clear-all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ClearAllOrders()
    {
        // ExecuteDeleteAsync sẽ xóa sạch bảng Orders mà không ảnh hưởng tới ID đếm tự động
        await _db.Orders.ExecuteDeleteAsync();
        
        return Ok(new { message = "Đã xóa toàn bộ lịch sử đơn hàng. ID tiếp theo sẽ tiếp tục tự động tăng." });
    }
}