using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(bool Success, string ErrorMessage, object? Data)> LoginAsync(LoginDto dto);
        Task<(bool Success, object? ErrorData)> RegisterAsync(RegisterDto dto);
        Task<(bool Success, string ErrorMessage)> VerifyOtpAsync(VerifyOtpDto dto);
        Task<(bool Success, string ErrorMessage)> ResendOtpAsync(ResendOtpDto dto);
        Task<(bool Success, string ErrorMessage)> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<(bool Success, string ErrorMessage)> ResetPasswordAsync(ResetPasswordDto dto);
    }
}
