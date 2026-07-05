namespace WebApplication1.DTOs
{
    public class OrderDto
    {        
         public int Id { get; set; }

        public string CustomerName { get; set; }
        public string Phone { get; set; }

        public DateTime OrderDate { get; set; }

        public decimal TotalAmount { get; set; }
        public string ShippingAddress { get; set; }

        public string Status { get; set; }

        public string PaymentMethod { get; set; }
        public string PaymentStatus { get; set; }

        public List<OrderDetailDto> Items { get; set; }
    }

    public class CheckoutDto
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Vui lòng nhập địa chỉ giao hàng")]
        public string ShippingAddress { get; set; }

        public string Phone { get; set; }

        public string PaymentMethod { get; set; } = "COD";
        
        public decimal ShippingFee { get; set; } = 0;
    }
}