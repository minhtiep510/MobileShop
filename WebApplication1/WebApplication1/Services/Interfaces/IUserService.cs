using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface IUserService
    {
        Task<int> GetUserCountAsync();
        Task<PagedResult<UserDto>> GetAllAsync(int page = 1, int pageSize = 10, string searchTerm = null);
        Task<UserDto?> GetByIdAsync(int id);
        Task<(bool Success, string ErrorMessage, UserDto? Data)> CreateAsync(UserDto dto);
        Task<(bool Success, string ErrorMessage)> UpdateAsync(int id, UserDto dto);
        Task<(bool Success, string ErrorMessage)> DeleteAsync(int id);
    }
}
