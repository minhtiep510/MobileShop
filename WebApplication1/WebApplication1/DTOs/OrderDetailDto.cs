namespace WebApplication1.DTOs
{
    public class OrderDetailDto
    {
     public int ProductVariantId { get; set; }
     public int ProductId { get; set; }

    public string ProductName { get; set; }

    public string Color { get; set; }
    public string Size { get; set; }

    public int Quantity { get; set; }
    public decimal Price { get; set; }

    public string ProductImage { get; set; }
    public string Sku { get; set; }
    }
}