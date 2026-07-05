using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using WebApplication1.Model;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;

        public ProfileController(UserManager<ApplicationUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            // Tính tổng tiền đã mua (những đơn hàng đã Delivered)
            var totalSpent = await _context.Orders
                .Where(o => o.UserId == user.Id && o.Status.ToLower() == "delivered")
                .SumAsync(o => o.TotalAmount);

            // Tính Rank
            string rank = "Thành viên (Đồng)";
            if (totalSpent >= 50000000) rank = "Kim Cương";
            else if (totalSpent >= 20000000) rank = "Vàng";
            else if (totalSpent >= 10000000) rank = "Bạc";

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.Address,
                TotalSpent = totalSpent,
                Rank = rank
            });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            var result = await _userManager.ChangePasswordAsync(user, dto.OldPassword, dto.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Mật khẩu hiện tại không chính xác hoặc mật khẩu mới không hợp lệ." });
            }

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber;
            user.Address = dto.Address;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Có lỗi xảy ra khi cập nhật hồ sơ." });
            }

            return Ok(new { message = "Cập nhật hồ sơ thành công." });
        }
    }
}
