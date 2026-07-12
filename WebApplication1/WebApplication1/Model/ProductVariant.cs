using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Model
{
    public class ProductVariant : EntityBase
    {

            public int ProductId { get; set; }

            [MaxLength(50)]
            public string SKU { get; set; } // Ví dụ: IPH15-PRO-256-TITAN

            [Required]
            [Column(TypeName = "decimal(18,2)")]
            public decimal Price { get; set; }

            [ConcurrencyCheck]
            public int StockQuantity { get; set; } = 0;

            [MaxLength(50)]
            public string Color { get; set; } // Ví dụ: Titan tự nhiên, Đen

            [MaxLength(50)]
            public string Capacity { get; set; } // Ví dụ: 128GB, 256GB

            [MaxLength(50)]
            public string Condition { get; set; } = "Mới 100%";

            // Navigation properties
            [ForeignKey("ProductId")]
            public Product Product { get; set; }

            public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
            public ICollection<Image> Images { get; set; } = new List<Image>();
    }
}