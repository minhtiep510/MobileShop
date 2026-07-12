using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Model
{
    public class Category : EntityBase
    {

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        // Navigation property
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
