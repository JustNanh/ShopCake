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
public record OrderCreateDto(int CustomerId, List<OrderItemDto> Items, string? RecipientName, string? RecipientPhone, string? ShippingAddress, string? City, string? District, string? ShippingMethod, string? PaymentMethod);
public record OrderStatusDto(string Status);

// Category
public record CategoryDto(string CategoryName);

// Payment
public record PaymentCreateDto(int OrderId, string PaymentMethod, decimal Amount);

// Review
public record ReviewCreateDto(int ProductId, int Rating, string? Comment);

// Customer
public record CustomerUpdateDto(string FullName, string? Phone, string? Address, string? Gender);

// ==========================================
// THÊM 2 DÒNG NÀY ĐỂ FIX LỖI ORDERS CONTROLLER
// ==========================================
public record OrderDetailResponseDto(int DetailId, int ProductId, string ProductName, int Quantity, decimal PriceAtPurchase, string? ImageUrl);

public record OrderResponseDto(int OrderId, int CustomerId, string? CustomerName, DateTime OrderDate, decimal TotalAmount, string Status, string? ShippingAddress, string? City, string? District, string? ShippingMethod, string? PaymentMethod, List<OrderDetailResponseDto> Items);