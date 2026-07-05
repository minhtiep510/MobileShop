using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc")]
        public string FullName { get; set; }

        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
    }
}
