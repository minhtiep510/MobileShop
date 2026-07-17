using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface IBannerService
    {
        Task<List<BannerDto>> GetAllAsync(bool? isActive = null);
        Task<BannerDto?> GetByIdAsync(int id);
        Task<BannerDto> CreateAsync(BannerDto dto);
        Task<bool> UpdateAsync(int id, BannerDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
