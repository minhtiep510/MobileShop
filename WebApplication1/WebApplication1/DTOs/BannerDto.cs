namespace WebApplication1.DTOs
{
    public class BannerDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string ImageUrl { get; set; } = "";
        public string LinkUrl { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedDate { get; set; }
    }
}
