namespace QLBN.Api.DTOs;

// Auth
public record RegisterDto(string FullName, string Email, string Password, string? Phone, string? Address, string? Gender);
public record LoginDto(string Email, string Password);

// SỬA: Thêm "string Role" vào cuối
public record AuthResponseDto(string Token, int CustomerId, string FullName, string Email, string Role);

// Product
public record ProductCreateDto(int? CategoryId, string ProductName, string? Flavor, string? Description, decimal Price, string? ImageUrl);
public record ProductUpdateDto(int? CategoryId, string ProductName, string? Flavor, string? Description, decimal Price, string? ImageUrl);

// Order
public record OrderItemDto(int ProductId, int Quantity, decimal PriceAtPurchase);
public record OrderCreateDto(int CustomerId, List<OrderItemDto> Items);
public record OrderStatusDto(string Status);

// Category
public record CategoryDto(string CategoryName);

// Payment
public record PaymentCreateDto(int OrderId, string PaymentMethod, decimal Amount);

// Review
public record ReviewCreateDto(int ProductId, int Rating, string? Comment);

// Customer
public record CustomerUpdateDto(string FullName, string? Phone, string? Address, string? Gender);