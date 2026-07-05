using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("monthly-revenue")]
        public async Task<IActionResult> GetMonthlyRevenue([FromQuery] int? year)
        {
            int targetYear = year ?? DateTime.Now.Year;
            var data = await _dashboardService.GetMonthlyRevenueAsync(targetYear);
            return Ok(data);
        }

        [HttpGet("best-sellers")]
        public async Task<IActionResult> GetBestSellingProducts([FromQuery] int limit = 5)
        {
            var data = await _dashboardService.GetBestSellingProductsAsync(limit);
            return Ok(data);
        }
    }
}
