using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year);
        Task<List<BestSellingProductDto>> GetBestSellingProductsAsync(int limit = 5);
    }
}
