using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class CouponService : ICouponService
    {
        private readonly AppDbContext _context;

        public CouponService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CouponDto?> GetCouponByIdAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return null;

            return new CouponDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                DiscountAmount = coupon.DiscountAmount,
                MinimumOrderAmount = coupon.MinimumOrderAmount,
                RequiredRank = coupon.RequiredRank,
                UsageLimit = coupon.UsageLimit,
                TimesUsed = coupon.TimesUsed,
                ExpirationDate = coupon.ExpirationDate,
                IsActive = coupon.IsActive
            };
        }

        public async Task<IEnumerable<CouponDto>> ListCouponsAsync()
        {
            return await _context.Coupons
                .OrderByDescending(c => c.CreatedDate)
                .Select(c => new CouponDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    DiscountAmount = c.DiscountAmount,
                    MinimumOrderAmount = c.MinimumOrderAmount,
                    RequiredRank = c.RequiredRank,
                    UsageLimit = c.UsageLimit,
                    TimesUsed = c.TimesUsed,
                    ExpirationDate = c.ExpirationDate,
                    IsActive = c.IsActive
                })
                .ToListAsync();
        }

        public async Task<bool> CreateCouponAsync(CouponDto dto)
        {
            var exists = await _context.Coupons.AnyAsync(c => c.Code.ToLower() == dto.Code.ToLower());
            if (exists) return false;

            var coupon = new Coupon
            {
                Code = dto.Code.Trim().ToUpper(),
                DiscountAmount = dto.DiscountAmount,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                RequiredRank = string.IsNullOrEmpty(dto.RequiredRank) ? "All" : dto.RequiredRank,
                UsageLimit = dto.UsageLimit,
                TimesUsed = 0,
                ExpirationDate = dto.ExpirationDate,
                IsActive = dto.IsActive
            };

            _context.Coupons.Add(coupon);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> UpdateCouponAsync(int id, CouponDto dto)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;

            coupon.Code = dto.Code.Trim().ToUpper();
            coupon.DiscountAmount = dto.DiscountAmount;
            coupon.MinimumOrderAmount = dto.MinimumOrderAmount;
            coupon.RequiredRank = string.IsNullOrEmpty(dto.RequiredRank) ? "All" : dto.RequiredRank;
            coupon.UsageLimit = dto.UsageLimit;
            coupon.ExpirationDate = dto.ExpirationDate;
            coupon.IsActive = dto.IsActive;

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteCouponAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;

            _context.Coupons.Remove(coupon);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<ApplyCouponResultDto> ApplyCouponAsync(int userId, ApplyCouponDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Code))
            {
                return new ApplyCouponResultDto { Success = false, Message = "Vui lòng nhập mã giảm giá" };
            }

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToUpper() == dto.Code.Trim().ToUpper());

            if (coupon == null)
            {
                return new ApplyCouponResultDto { Success = false, Message = "Mã giảm giá không tồn tại" };
            }

            if (!coupon.IsActive)
            {
                return new ApplyCouponResultDto { Success = false, Message = "Mã giảm giá này hiện đang bị tạm khóa" };
            }

            if (coupon.ExpirationDate < DateTime.Now)
            {
                return new ApplyCouponResultDto { Success = false, Message = "Mã giảm giá đã hết hạn sử dụng" };
            }

            if (coupon.UsageLimit > 0 && coupon.TimesUsed >= coupon.UsageLimit)
            {
                return new ApplyCouponResultDto { Success = false, Message = "Mã giảm giá đã hết lượt sử dụng" };
            }

            // Kiểm tra giá trị đơn hàng tối thiểu
            if (coupon.MinimumOrderAmount > 0 && dto.OrderAmount < coupon.MinimumOrderAmount)
            {
                return new ApplyCouponResultDto
                {
                    Success = false,
                    Message = $"Đơn hàng tối thiểu phải từ {coupon.MinimumOrderAmount:N0} đ để dùng mã này"
                };
            }

            // Kiểm tra Rank thành viên nếu có yêu cầu
            if (!string.IsNullOrEmpty(coupon.RequiredRank) && coupon.RequiredRank != "All")
            {
                // Tính tổng chi tiêu của user từ các đơn hàng hoàn tất/thanh toán
                var totalSpent = await _context.Orders
                    .Where(o => o.UserId == userId && (o.PaymentStatus == "Paid" || o.Status == "delivered"))
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                string userRank = "Bronze";
                if (totalSpent >= 30000000) userRank = "Diamond";
                else if (totalSpent >= 15000000) userRank = "Gold";
                else if (totalSpent >= 5000000) userRank = "Silver";

                var rankOrder = new Dictionary<string, int>
                {
                    { "Bronze", 1 },
                    { "Silver", 2 },
                    { "Gold", 3 },
                    { "Diamond", 4 }
                };

                int requiredLevel = rankOrder.ContainsKey(coupon.RequiredRank) ? rankOrder[coupon.RequiredRank] : 1;
                int currentLevel = rankOrder.ContainsKey(userRank) ? rankOrder[userRank] : 1;

                if (currentLevel < requiredLevel)
                {
                    return new ApplyCouponResultDto
                    {
                        Success = false,
                        Message = $"Mã này chỉ dành cho khách hạng {coupon.RequiredRank} trở lên (Hạng hiện tại của bạn: {userRank})"
                    };
                }
            }

            return new ApplyCouponResultDto
            {
                Success = true,
                Message = $"Áp dụng mã {coupon.Code} thành công!",
                DiscountAmount = coupon.DiscountAmount,
                Code = coupon.Code
            };
        }
    }
}
