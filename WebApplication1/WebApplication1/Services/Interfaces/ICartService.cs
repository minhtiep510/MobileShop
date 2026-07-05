using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface ICartService
    {
        Task<CartDto> GetCartAsync(int userId);
        Task<(bool Success, string ErrorMessage)> AddToCartAsync(int userId, AddToCartDto dto);
        Task<(bool Success, string ErrorMessage)> UpdateCartItemAsync(int userId, int cartItemId, int quantity);
        Task<(bool Success, string ErrorMessage)> RemoveFromCartAsync(int userId, int cartItemId);
        Task<(bool Success, string ErrorMessage)> ClearCartAsync(int userId);
    }
}
