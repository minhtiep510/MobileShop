using Microsoft.EntityFrameworkCore;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class BannerService : IBannerService
    {
        private readonly AppDbContext _context;

        public BannerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<BannerDto>> GetAllAsync(bool? isActive = null)
        {
            var query = _context.Banners.AsQueryable();

            if (isActive.HasValue)
                query = query.Where(b => b.IsActive == isActive.Value);

            return await query
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedDate)
                .Select(b => new BannerDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = b.ImageUrl,
                    LinkUrl = b.LinkUrl,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder,
                    CreatedDate = b.CreatedDate
                })
                .ToListAsync();
        }

        public async Task<BannerDto?> GetByIdAsync(int id)
        {
            var b = await _context.Banners.FindAsync(id);
            if (b == null) return null;

            return new BannerDto
            {
                Id = b.Id,
                Title = b.Title,
                ImageUrl = b.ImageUrl,
                LinkUrl = b.LinkUrl,
                IsActive = b.IsActive,
                DisplayOrder = b.DisplayOrder,
                CreatedDate = b.CreatedDate
            };
        }

        public async Task<BannerDto> CreateAsync(BannerDto dto)
        {
            var banner = new Banner
            {
                Title = dto.Title,
                ImageUrl = dto.ImageUrl,
                LinkUrl = dto.LinkUrl,
                IsActive = dto.IsActive,
                DisplayOrder = dto.DisplayOrder
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();

            dto.Id = banner.Id;
            dto.CreatedDate = banner.CreatedDate;
            return dto;
        }

        public async Task<bool> UpdateAsync(int id, BannerDto dto)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return false;

            banner.Title = dto.Title;
            banner.ImageUrl = dto.ImageUrl;
            banner.LinkUrl = dto.LinkUrl;
            banner.IsActive = dto.IsActive;
            banner.DisplayOrder = dto.DisplayOrder;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return false;

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
