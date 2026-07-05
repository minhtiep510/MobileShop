using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var (success, errorMsg, data) = await _authService.LoginAsync(dto);
            if (!success)
            {
                return Unauthorized(new { message = errorMsg });
            }

            return Ok(data);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var (success, errorData) = await _authService.RegisterAsync(dto);
            if (!success)
            {
                return BadRequest(errorData);
            }

            return Ok(new { message = "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP." });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyOtpDto dto)
        {
            var (success, errorMsg) = await _authService.VerifyOtpAsync(dto);
            if (!success)
            {
                return BadRequest(new { message = errorMsg });
            }

            return Ok(new { message = "Xác thực email thành công." });
        }

        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto dto)
        {
            var (success, errorMsg) = await _authService.ResendOtpAsync(dto);
            if (!success)
            {
                return BadRequest(new { message = errorMsg });
            }

            return Ok(new { message = "Mã OTP mới đã được gửi đến email của bạn." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var (success, errorMsg) = await _authService.ForgotPasswordAsync(dto);
            if (!success)
            {
                return BadRequest(new { message = errorMsg });
            }

            return Ok(new { message = "Mã OTP đã được gửi đến email của bạn." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var (success, errorMsg) = await _authService.ResetPasswordAsync(dto);
            if (!success)
            {
                return BadRequest(new { message = errorMsg });
            }

            return Ok(new { message = "Đặt lại mật khẩu thành công." });
        }
    }
}