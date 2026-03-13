using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using QLBN.Api.Data;
using QLBN.Api.DTOs;
using QLBN.Api.Models;

namespace QLBN.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Tags("Auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>Đăng ký tài khoản mới</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Customers.AnyAsync(c => c.Email == dto.Email))
            return Conflict(new { message = "Email đã được sử dụng." });

        var customer = new Customer
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            Gender = dto.Gender,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return CreatedAtAction(null, new { message = "Đăng ký thành công!" });
    }

    /// <summary>Đăng nhập - trả về JWT token</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == dto.Email);
        if (customer == null || !BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash))
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        var token = GenerateJwt(customer);
        return Ok(new AuthResponseDto(token, customer.CustomerId, customer.FullName, customer.Email));
    }

    private string GenerateJwt(Customer customer)
    {
        var secret = _config["Jwt:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(int.Parse(_config["Jwt:ExpiresInDays"]!));

        var claims = new[]
        {
            new Claim("customer_id", customer.CustomerId.ToString()),
            new Claim(ClaimTypes.Email, customer.Email)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
