using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Model
{
    public class Coupon : EntityBase
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinimumOrderAmount { get; set; } = 0;

        [MaxLength(50)]
        public string RequiredRank { get; set; } = "All";

        public int UsageLimit { get; set; } = 0;

        public int TimesUsed { get; set; } = 0;

        [Required]
        public DateTime ExpirationDate { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
