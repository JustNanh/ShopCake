using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;

namespace QLBN.Api.Controllers;

[ApiController]
[Route("api/products")]
[Tags("Products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    /// <summary>Lấy tất cả sản phẩm (kèm danh mục) - Public</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Products.Include(p => p.Category).ToListAsync());

    /// <summary>Lấy chi tiết 1 sản phẩm - Public</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.ProductId == id);
        return p == null ? NotFound(new { message = "Không tìm thấy sản phẩm." }) : Ok(p);
    }

    /// <summary>Thêm sản phẩm mới (Chỉ Admin)</summary>
    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
    {
        var product = new Product
        {
            CategoryId = dto.CategoryId,
            ProductName = dto.ProductName,
            Flavor = dto.Flavor,
            Description = dto.Description,
            Price = dto.Price,
            ImageUrl = dto.ImageUrl
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = product.ProductId }, product);
    }

    /// <summary>Cập nhật sản phẩm (Chỉ Admin)</summary>
    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

        product.CategoryId = dto.CategoryId;
        product.ProductName = dto.ProductName;
        product.Flavor = dto.Flavor;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.ImageUrl = dto.ImageUrl;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật sản phẩm thành công!" });
    }

    /// <summary>Xóa sản phẩm (Chỉ Admin)</summary>
    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });
        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa sản phẩm thành công!" });
    }
}