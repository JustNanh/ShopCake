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

    /// <summary>Lấy danh sách sản phẩm đã được mua (Chỉ Admin)</summary>
    [HttpGet("stats/purchased-products")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPurchasedProducts()
    {
        var purchasedProducts = await _db.Order_Details
            .Include(od => od.Product)
            .Include(od => od.Order)
            .GroupBy(od => od.ProductId)
            .Select(g => new
            {
                productId = g.Key,
                productName = g.First().Product!.ProductName,
                totalQuantitySold = g.Sum(od => od.Quantity),
                totalRevenue = g.Sum(od => od.Quantity * od.PriceAtPurchase),
                lastPurchaseDate = g.Max(od => od.Order!.OrderDate),
                purchaseCount = g.Select(od => od.OrderId).Distinct().Count(), // Số lần được mua
                price = g.First().Product!.Price,
                category = g.First().Product!.Category!.CategoryName,
            })
            .OrderByDescending(p => p.totalQuantitySold)
            .ToListAsync();

        return Ok(purchasedProducts);
    }

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
        
        try
        {
            await _db.SaveChangesAsync();
            
            // Maintain identity seed
            var maxOrderId = await _db.Orders.MaxAsync(o => (int?)o.OrderId) ?? 0;
            if (maxOrderId > 0)
            {
                await _db.Database.ExecuteSqlInterpolatedAsync(
                    $"DBCC CHECKIDENT('Orders', RESEED, {maxOrderId})"
                );
            }
            
            return Ok(new { message = "Xóa hóa đơn thành công!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Lỗi khi xóa hóa đơn: " + ex.Message });
        }
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
        
        try
        {
            await _db.SaveChangesAsync();
            
            // Kiểm tra xem đó có phải order cuối cùng không
            var maxOrderId = await _db.Orders.MaxAsync(o => (int?)o.OrderId) ?? 0;
            
            // Cập nhật identity seed để ID tiếp theo = maxOrderId + 1
            if (maxOrderId > 0)
            {
                await _db.Database.ExecuteSqlInterpolatedAsync(
                    $"DBCC CHECKIDENT('Orders', RESEED, {maxOrderId})"
                );
            }
            
            return Ok(new { message = "Đã hủy và xóa đơn hàng thành công!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Lỗi khi xóa đơn hàng: " + ex.Message });
        }
    }

    /// <summary>Xóa toàn bộ lịch sử đơn hàng (Chỉ Admin) - KHÔNG làm reset ID</summary>
    [HttpDelete("clear-all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ClearAllOrders()
    {
        try
        {
            // Lưu ID cao nhất trước khi xóa
            var maxOrderId = await _db.Orders.MaxAsync(o => (int?)o.OrderId) ?? 0;
            
            // Xóa tất cả payment trước (vì có foreign key từ Orders)
            await _db.Payments.ExecuteDeleteAsync();
            
            // Xóa tất cả order details
            await _db.Order_Details.ExecuteDeleteAsync();
            
            // Xóa tất cả orders
            await _db.Orders.ExecuteDeleteAsync();
            
            // Reset identity seed để tiếp tục từ giá trị cao nhất + 1
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"DBCC CHECKIDENT('Orders', RESEED, {maxOrderId})"
            );
            
            return Ok(new { 
                message = "Đã xóa toàn bộ lịch sử đơn hàng. ID tiếp theo sẽ tiếp tục tự động tăng từ: " + (maxOrderId + 1)
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Lỗi khi xóa dữ liệu: " + ex.Message });
        }
    }

    /// <summary>Reset ID đơn hàng (Chỉ Admin) - Cho ID bắt đầu lại từ 1</summary>
    [HttpPost("reset-id")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetOrderId()
    {
        try
        {
            // Reset identity seed về 1
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"DBCC CHECKIDENT('Orders', RESEED, 0)"
            );
            
            return Ok(new { 
                message = "ID đơn hàng đã được reset. Đơn hàng mới sẽ bắt đầu từ ID: 1"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Lỗi khi reset ID: " + ex.Message });
        }
    }
}