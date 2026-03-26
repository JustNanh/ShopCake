using Microsoft.EntityFrameworkCore;
using QLBN.Api.Models;

namespace QLBN.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Customer> Customers { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderDetail> Order_Details { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<SalesStats> SalesStats { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map đúng tên bảng trong SQL Server
        modelBuilder.Entity<Customer>().ToTable("Customers");
        modelBuilder.Entity<Category>().ToTable("Categories");
        modelBuilder.Entity<Product>().ToTable("Products");
        modelBuilder.Entity<Order>().ToTable("Orders");
        modelBuilder.Entity<OrderDetail>().ToTable("Order_Details");
        modelBuilder.Entity<Payment>().ToTable("Payments");
        modelBuilder.Entity<Review>().ToTable("Reviews");

        // Map đúng tên cột (snake_case trong DB → PascalCase trong C#)
        modelBuilder.Entity<Customer>(e => {
            e.Property(x => x.CustomerId).HasColumnName("customer_id");
            e.Property(x => x.FullName).HasColumnName("full_name");
            e.Property(x => x.Phone).HasColumnName("phone");
            e.Property(x => x.Email).HasColumnName("email");
            e.Property(x => x.Address).HasColumnName("address");
            e.Property(x => x.Gender).HasColumnName("gender");
            e.Property(x => x.PasswordHash).HasColumnName("password_hash");
            e.Property(x => x.Role).HasColumnName("role");
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.CategoryName).HasColumnName("category_name");
        });

        modelBuilder.Entity<Product>(e => {
            e.Property(x => x.ProductId).HasColumnName("product_id");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.ProductName).HasColumnName("product_name");
            e.Property(x => x.Flavor).HasColumnName("flavor");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Price).HasColumnName("price");
            e.Property(x => x.ImageUrl).HasColumnName("image_url");
        });

        modelBuilder.Entity<Order>(e => {
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.CustomerId).HasColumnName("customer_id");
            e.Property(x => x.OrderDate).HasColumnName("order_date");
            e.Property(x => x.TotalAmount).HasColumnName("total_amount");
            e.Property(x => x.Status).HasColumnName("status");
        });

        modelBuilder.Entity<OrderDetail>(e => {
            e.Property(x => x.DetailId).HasColumnName("detail_id");
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.ProductId).HasColumnName("product_id");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.PriceAtPurchase).HasColumnName("price_at_purchase");
        });

        modelBuilder.Entity<Payment>(e => {
            e.Property(x => x.PaymentId).HasColumnName("payment_id");
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method");
            e.Property(x => x.PaymentDate).HasColumnName("payment_date");
            e.Property(x => x.Amount).HasColumnName("amount");
        });

        modelBuilder.Entity<Review>(e => {
            e.Property(x => x.ReviewId).HasColumnName("review_id");
            e.Property(x => x.CustomerId).HasColumnName("customer_id");
            e.Property(x => x.ProductId).HasColumnName("product_id");
            e.Property(x => x.Rating).HasColumnName("rating");
            e.Property(x => x.Comment).HasColumnName("comment");
            e.Property(x => x.ReviewDate).HasColumnName("review_date");
        });

        modelBuilder.Entity<SalesStats>(e => {
            e.Property(x => x.StatsId).HasColumnName("stats_id");
            e.Property(x => x.Year).HasColumnName("year");
            e.Property(x => x.Month).HasColumnName("month");
            e.Property(x => x.TotalRevenue).HasColumnName("total_revenue");
            e.Property(x => x.TotalOrders).HasColumnName("total_orders");
            e.Property(x => x.DeliveredOrders).HasColumnName("delivered_orders");
            e.Property(x => x.LastUpdated).HasColumnName("last_updated");
            e.HasIndex(x => new { x.Year, x.Month }).IsUnique();
        });

        // Cascades
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderDetail>()
            .HasOne(od => od.Order)
            .WithMany(o => o.OrderDetails)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderDetail>()
            .HasOne(od => od.Product)
            .WithMany(p => p.OrderDetails)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Customer)
            .WithMany(c => c.Reviews)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Product)
            .WithMany(p => p.Reviews)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
