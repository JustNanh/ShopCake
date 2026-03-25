using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLBN.Api.Models;

public class Customer
{
    [Key] public int CustomerId { get; set; }
    [Required, MaxLength(100)] public string FullName { get; set; } = "";
    [MaxLength(20)] public string? Phone { get; set; }
    [Required, MaxLength(150)] public string Email { get; set; } = "";
    public string? PasswordHash { get; set; }
    public string? Address { get; set; }
    [MaxLength(10)] public string? Gender { get; set; }

    // Thêm trường phân quyền, mặc định là "Customer"
    [MaxLength(20)] public string Role { get; set; } = "Customer";

    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class Category
{
    [Key] public int CategoryId { get; set; }
    [Required, MaxLength(100)] public string CategoryName { get; set; } = "";
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Product
{
    [Key] public int ProductId { get; set; }
    public int? CategoryId { get; set; }
    [Required, MaxLength(150)] public string ProductName { get; set; } = "";
    [MaxLength(100)] public string? Flavor { get; set; }
    public string? Description { get; set; }
    [Required, Column(TypeName = "decimal(10,2)")] public decimal Price { get; set; }
    [MaxLength(255)] public string? ImageUrl { get; set; }

    [ForeignKey("CategoryId")] public Category? Category { get; set; }
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class Order
{
    [Key] public int OrderId { get; set; }
    [Required] public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.Now;
    [Required, Column(TypeName = "decimal(10,2)")] public decimal TotalAmount { get; set; }
    [Required, MaxLength(50)] public string Status { get; set; } = "Pending";
    
    // Thông tin giao hàng
    [MaxLength(100)] public string? RecipientName { get; set; }
    [MaxLength(20)] public string? RecipientPhone { get; set; }
    [MaxLength(255)] public string? ShippingAddress { get; set; }
    [MaxLength(50)] public string? City { get; set; }
    [MaxLength(50)] public string? District { get; set; }
    [MaxLength(50)] public string? ShippingMethod { get; set; }
    [MaxLength(50)] public string? PaymentMethod { get; set; }

    [ForeignKey("CustomerId")] public Customer? Customer { get; set; }
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class OrderDetail
{
    [Key] public int DetailId { get; set; }
    [Required] public int OrderId { get; set; }
    [Required] public int ProductId { get; set; }
    [Required, Range(1, int.MaxValue)] public int Quantity { get; set; }
    [Required, Column(TypeName = "decimal(10,2)")] public decimal PriceAtPurchase { get; set; }

    [ForeignKey("OrderId")] public Order? Order { get; set; }
    [ForeignKey("ProductId")] public Product? Product { get; set; }
}

public class Payment
{
    [Key] public int PaymentId { get; set; }
    public int? OrderId { get; set; }
    [MaxLength(50)] public string? PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.Now;
    [Required, Column(TypeName = "decimal(10,2)")] public decimal Amount { get; set; }

    [ForeignKey("OrderId")] public Order? Order { get; set; }
}

public class Review
{
    [Key] public int ReviewId { get; set; }
    public int? CustomerId { get; set; }
    public int? ProductId { get; set; }
    [Required, Range(1, 5)] public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime ReviewDate { get; set; } = DateTime.Now;

    [ForeignKey("CustomerId")] public Customer? Customer { get; set; }
    [ForeignKey("ProductId")] public Product? Product { get; set; }
}
