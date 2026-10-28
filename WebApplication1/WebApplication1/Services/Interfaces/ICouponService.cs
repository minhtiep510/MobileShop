using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.DTOs;

namespace WebApplication1.Services.Interfaces
{
    public interface ICouponService
    {
        Task<CouponDto?> GetCouponByIdAsync(int id);
        Task<IEnumerable<CouponDto>> ListCouponsAsync();
        Task<ApplyCouponResultDto> ApplyCouponAsync(int userId, ApplyCouponDto dto);
        Task<bool> CreateCouponAsync(CouponDto dto);
        Task<bool> UpdateCouponAsync(int id, CouponDto dto);
        Task<bool> DeleteCouponAsync(int id);
    }
}
