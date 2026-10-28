using System;

namespace WebApplication1.DTOs
{
    public class CouponDto
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal MinimumOrderAmount { get; set; } = 0;
        public string RequiredRank { get; set; } = "All";
        public int UsageLimit { get; set; } = 0;
        public int TimesUsed { get; set; } = 0;
        public DateTime ExpirationDate { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ApplyCouponDto
    {
        public string Code { get; set; }
        public decimal OrderAmount { get; set; } = 0;
    }

    public class ApplyCouponResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Code { get; set; }
    }
}