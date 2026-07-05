namespace WebApplication1.DTOs
{
    public class OrderItemResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string CustomerName { get; set; }
        public string Phone { get; set; }

        public string ShippingAddress { get; set; }

        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }

        public string Status { get; set; }

        public string PaymentMethod { get; set; }
        public string PaymentStatus { get; set; }

        public List<OrderDetailDto> Items { get; set; }
    }
}