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
            e.Property(x => x.PasswordHash).HasColumnName("password_hash");
        });

        modelBuilder.Entity<Category>(e =>
            e.Property(x => x.CategoryId).HasColumnName("category_id"));

        modelBuilder.Entity<Product>(e => {
            e.Property(x => x.ProductId).HasColumnName("product_id");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.ProductName).HasColumnName("product_name");
            e.Property(x => x.ImageUrl).HasColumnName("image_url");
        });

        modelBuilder.Entity<Order>(e => {
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.CustomerId).HasColumnName("customer_id");
            e.Property(x => x.OrderDate).HasColumnName("order_date");
            e.Property(x => x.TotalAmount).HasColumnName("total_amount");
        });

        modelBuilder.Entity<OrderDetail>(e => {
            e.Property(x => x.DetailId).HasColumnName("detail_id");
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.ProductId).HasColumnName("product_id");
            e.Property(x => x.PriceAtPurchase).HasColumnName("price_at_purchase");
        });

        modelBuilder.Entity<Payment>(e => {
            e.Property(x => x.PaymentId).HasColumnName("payment_id");
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method");
            e.Property(x => x.PaymentDate).HasColumnName("payment_date");
        });

        modelBuilder.Entity<Review>(e => {
            e.Property(x => x.ReviewId).HasColumnName("review_id");
            e.Property(x => x.CustomerId).HasColumnName("customer_id");
            e.Property(x => x.ProductId).HasColumnName("product_id");
            e.Property(x => x.ReviewDate).HasColumnName("review_date");
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
