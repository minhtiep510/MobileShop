using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface IProductService
    {
        Task<int> GetTotalStockAsync();
        Task<PagedResult<ProductListDto>> GetAllAsync(int page = 1, int pageSize = 10, int? categoryId = null, string searchTerm = null);
        Task<object?> GetDetailAsync(int id);
        Task<(bool Success, string ErrorMessage, object? Data)> CreateAsync(ProductCreateDto dto);
        Task<(bool Success, string ErrorMessage, object? Data)> UpdateAsync(int id, ProductCreateDto dto);
        Task<(bool Success, string ErrorMessage)> DeleteAsync(int id);
        Task<(bool Success, string ErrorMessage)> CreateVariantAsync(int productId, ProductVariantDto dto);
        Task<(bool Success, string ErrorMessage)> UpdateVariantAsync(int id, ProductVariantDto dto);
        Task<(bool Success, string ErrorMessage)> DeleteVariantAsync(int id);
    }
}
