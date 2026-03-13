using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;

namespace QLBN.Api.Controllers;

// ─────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────
[ApiController]
[Route("api/categories")]
[Tags("Categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    /// <summary>Lấy tất cả danh mục</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _db.Categories.ToListAsync());

    /// <summary>Thêm danh mục mới</summary>
    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] CategoryDto dto)
    {
        var cat = new Category { CategoryName = dto.CategoryName };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return CreatedAtAction(null, new { message = "Thêm danh mục thành công!", cat.CategoryId });
    }

    /// <summary>Cập nhật danh mục</summary>
    [HttpPut("{id}"), Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.CategoryName = dto.CategoryName;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật danh mục thành công!" });
    }

    /// <summary>Xóa danh mục</summary>
    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa danh mục thành công!" });
    }
}

// ─────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────
[ApiController]
[Route("api/customers")]
[Authorize]
[Tags("Customers")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    /// <summary>Lấy danh sách khách hàng</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Customers.Select(c => new { c.CustomerId, c.FullName, c.Phone, c.Email, c.Address, c.Gender }).ToListAsync());

    /// <summary>Lấy chi tiết 1 khách hàng</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Customers.Select(x => new { x.CustomerId, x.FullName, x.Phone, x.Email, x.Address, x.Gender })
            .FirstOrDefaultAsync(x => x.CustomerId == id);
        return c == null ? NotFound(new { message = "Không tìm thấy khách hàng." }) : Ok(c);
    }

    /// <summary>Cập nhật thông tin khách hàng</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateDto dto)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        c.FullName = dto.FullName; c.Phone = dto.Phone; c.Address = dto.Address; c.Gender = dto.Gender;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật thành công!" });
    }

    /// <summary>Xóa khách hàng</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        _db.Customers.Remove(c);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa khách hàng thành công!" });
    }
}

// ─────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────
[ApiController]
[Route("api/payments")]
[Authorize]
[Tags("Payments")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PaymentsController(AppDbContext db) => _db = db;

    /// <summary>Lấy thanh toán theo hóa đơn</summary>
    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetByOrder(int orderId) =>
        Ok(await _db.Payments.Where(p => p.OrderId == orderId).ToListAsync());

    /// <summary>Tạo thanh toán mới</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PaymentCreateDto dto)
    {
        var payment = new Payment { OrderId = dto.OrderId, PaymentMethod = dto.PaymentMethod, Amount = dto.Amount };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();
        return CreatedAtAction(null, new { message = "Thanh toán thành công!" });
    }
}

// ─────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────
[ApiController]
[Route("api/reviews")]
[Tags("Reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReviewsController(AppDbContext db) => _db = db;

    /// <summary>Lấy đánh giá của 1 sản phẩm</summary>
    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetByProduct(int productId) =>
        Ok(await _db.Reviews.Include(r => r.Customer)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.ReviewDate).ToListAsync());

    /// <summary>Thêm đánh giá (cần đăng nhập)</summary>
    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] ReviewCreateDto dto)
    {
        var customerId = int.Parse(User.FindFirst("customer_id")!.Value);
        var review = new Review { CustomerId = customerId, ProductId = dto.ProductId, Rating = dto.Rating, Comment = dto.Comment };
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();
        return CreatedAtAction(null, new { message = "Đánh giá thành công!" });
    }

    /// <summary>Xóa đánh giá</summary>
    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();
        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa đánh giá thành công!" });
    }
}
