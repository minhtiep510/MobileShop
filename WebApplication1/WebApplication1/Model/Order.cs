using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Model
{
    public class Order
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.Now;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Shipping, Completed, Cancelled

        [MaxLength(500)]
        public string ShippingAddress { get; set; }

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "COD";

        [MaxLength(50)]
        public string PaymentStatus { get; set; } = "Unpaid";

        // Navigation properties
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }
}
