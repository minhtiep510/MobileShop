namespace WebApplication1.DTOs
{
    public class MonthlyRevenueDto
    {
        public int Month { get; set; }
        public decimal Revenue { get; set; }
    }

    public class BestSellingProductDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public int VariantId { get; set; }
        public string VariantSku { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string Capacity { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}
