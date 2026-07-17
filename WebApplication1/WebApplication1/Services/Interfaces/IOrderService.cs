using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface IOrderService
    {
        Task<PagedResult<object>> GetAllAsync(int page = 1, int pageSize = 10, string searchTerm = null);
        Task<PagedResult<object>> GetMyOrdersAsync(int userId, int page = 1, int pageSize = 10);
        Task<OrderItemResponseDto?> GetDetailAsync(int id);
        Task<(bool Success, object? Data)> UpdateStatusAsync(int id, string status);
        Task<(bool Success, object? Data)> UpdatePaymentStatusAsync(int id, string paymentStatus);
        Task<bool> DeleteAsync(int id);
        Task<(bool Success, string ErrorMessage, int? OrderId)> CheckoutAsync(int userId, CheckoutDto dto);
        Task<(bool Success, string ErrorMessage)> CancelOrderAsync(int orderId, int userId);
    }
}
