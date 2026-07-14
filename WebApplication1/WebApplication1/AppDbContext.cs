using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using WebApplication1.Model;

namespace WebApplication1
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Đăng ký các DbSet tương ứng với các bảng trong DB
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<TechnicalSpecification> TechnicalSpecifications { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<Image> Images { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProductVariant>()
                .HasIndex(p => p.SKU)
                .IsUnique(false);

            // Tránh lỗi Cascade Delete khi xóa tài khoản hoặc biến thể (bảo toàn lịch sử đơn hàng)
            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.ProductVariant)
                .WithMany(pv => pv.OrderDetails)
                .HasForeignKey(od => od.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Image>()
                .HasOne(i => i.ProductVariant)
                .WithMany(pv => pv.Images)
                .HasForeignKey(i => i.ProductVariantId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries<EntityBase>();
            var now = DateTime.Now;

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedDate = now;
                    entry.Entity.UpdatedDate = now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Property(x => x.CreatedDate).IsModified = false;
                    entry.Entity.UpdatedDate = now;
                }
            }
        }
    }
}