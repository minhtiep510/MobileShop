
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Model
{
    public class TechnicalSpecification
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }

        [MaxLength(100)]
        public string SpecName { get; set; } // Ví dụ: Chipset, RAM

        [MaxLength(250)]
        public string SpecValue { get; set; } // Ví dụ: Apple A17 Pro, 8GB

        // Navigation property
        [ForeignKey("ProductId")]
        public Product Product { get; set; }
    }
}
