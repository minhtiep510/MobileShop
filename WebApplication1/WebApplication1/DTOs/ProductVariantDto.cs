namespace WebApplication1.DTOs
{
    public class ProductVariantDto
    {
        public int Id { get; set; }
        public string SKU { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public string Color { get; set; }
        public string Capacity { get; set; }
        public string Condition { get; set; }
        public List<VariantImageDto> Images { get; set; }
    }
}
