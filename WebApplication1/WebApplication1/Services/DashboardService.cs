using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year)
        {
            // Initialize with all 12 months set to 0 revenue
            var revenueByMonth = Enumerable.Range(1, 12).Select(m => new MonthlyRevenueDto
            {
                Month = m,
                Revenue = 0
            }).ToList();

            var orders = await _context.Orders
                .Where(o => o.OrderDate.Year == year && o.Status.ToLower() != "cancelled")
                .GroupBy(o => o.OrderDate.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    TotalRevenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

            foreach (var order in orders)
            {
                var monthData = revenueByMonth.FirstOrDefault(m => m.Month == order.Month);
                if (monthData != null)
                {
                    monthData.Revenue = order.TotalRevenue;
                }
            }

            return revenueByMonth;
        }

        public async Task<List<BestSellingProductDto>> GetBestSellingProductsAsync(int limit = 5)
        {
            var bestSellers = await _context.OrderDetails
                .Include(od => od.Order)
                .Include(od => od.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .Where(od => od.Order != null && od.Order.Status.ToLower() != "cancelled")
                .GroupBy(od => new { od.ProductVariant!.ProductId, od.ProductVariant.Product!.Name })
                .Select(g => new BestSellingProductDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalSold = g.Sum(od => od.Quantity)
                })
                .OrderByDescending(dto => dto.TotalSold)
                .Take(limit)
                .ToListAsync();

            return bestSellers;
        }
    }
}
