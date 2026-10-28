using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCouponById(int id)
        {
            var coupon = await _couponService.GetCouponByIdAsync(id);
            if (coupon == null)
            {
                return NotFound(new { message = "Coupon không tồn tại" });
            }
            return Ok(coupon);
        }

        [HttpGet]
        public async Task<IActionResult> ListCoupons()
        {
            var coupons = await _couponService.ListCouponsAsync();
            return Ok(coupons);
        }

        [HttpPost("apply")]
        [Authorize]
        public async Task<IActionResult> ApplyCoupon([FromBody] ApplyCouponDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out int userId);

            var result = await _couponService.ApplyCouponAsync(userId, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateCoupon([FromBody] CouponDto dto)
        {
            var success = await _couponService.CreateCouponAsync(dto);
            if (!success)
            {
                return BadRequest(new { message = "Mã coupon đã tồn tại" });
            }
            return Ok(new { message = "Tạo coupon thành công" });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateCoupon(int id, [FromBody] CouponDto dto)
        {
            var success = await _couponService.UpdateCouponAsync(id, dto);
            if (!success)
            {
                return NotFound(new { message = "Coupon không tồn tại" });
            }
            return Ok(new { message = "Cập nhật coupon thành công" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var success = await _couponService.DeleteCouponAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Coupon không tồn tại" });
            }
            return Ok(new { message = "Xóa coupon thành công" });
        }
    }
}
