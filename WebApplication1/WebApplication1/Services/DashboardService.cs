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
                .Where(o => o.OrderDate.Year == year && o.Status.ToLower() == "delivered")
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

        public async Task<List<BestSellingProductDto>> GetBestSellingProductsAsync(int limit = 10)
        {
            var bestSellers = await _context.OrderDetails
                .Include(od => od.Order)
                .Include(od => od.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .Include(od => od.ProductVariant)
                    .ThenInclude(pv => pv.Images)
                .Where(od => od.Order != null && od.Order.Status.ToLower() == "delivered")
                .GroupBy(od => new { 
                    VariantId = od.ProductVariantId, 
                    ProductId = od.ProductVariant!.ProductId, 
                    ProductName = od.ProductVariant.Product!.Name,
                    Sku = od.ProductVariant.SKU,
                    Color = od.ProductVariant.Color,
                    Size = od.ProductVariant.Size,
                    Price = od.ProductVariant.Price
                })
                .Select(g => new BestSellingProductDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    VariantId = g.Key.VariantId,
                    VariantSku = g.Key.Sku,
                    Color = g.Key.Color ?? "",
                    Size = g.Key.Size ?? "",
                    Price = g.Key.Price,
                    TotalSold = g.Sum(od => od.Quantity)
                })
                .OrderByDescending(dto => dto.TotalSold)
                .Take(limit)
                .ToListAsync();

            foreach (var item in bestSellers)
            {
                var variant = await _context.ProductVariants.Include(v => v.Images).FirstOrDefaultAsync(v => v.Id == item.VariantId);
                if (variant != null && variant.Images.Any())
                {
                    item.ThumbnailUrl = variant.Images.OrderByDescending(i => i.IsMain).First().ImageUrl;
                }
            }

            return bestSellers;
        }
    }
}
