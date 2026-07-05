using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class ProductCreateDto
    {
        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên sản phẩm không được vượt quá 200 ký tự")]
        public string Name { get; set; }
        public string Description { get; set; }
        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Danh mục không hợp lệ")]
        public int CategoryId { get; set; }

        [Required(ErrorMessage = "Sản phẩm phải có ít nhất 1 biến thể")]
        [MinLength(1, ErrorMessage = "Sản phẩm phải có ít nhất 1 biến thể")]
        public List<ProductVariantDto> Variants { get; set; } = new List<ProductVariantDto>();

        public List<TechnicalSpecDto>? Specifications { get; set; } = new List<TechnicalSpecDto>();
    }
}
