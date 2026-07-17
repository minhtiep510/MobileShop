using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Model
{
    public class Banner : EntityBase
    {
        [MaxLength(200)]
        public string Title { get; set; } = "";

        [Required]
        [MaxLength(1000)]
        public string ImageUrl { get; set; } = "";

        [MaxLength(500)]
        public string LinkUrl { get; set; } = "";

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;
    }
}
