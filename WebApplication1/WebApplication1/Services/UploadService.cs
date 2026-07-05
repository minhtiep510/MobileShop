using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class UploadService : IUploadService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UploadService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetBaseUrl()
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request == null) return "http://localhost:5136"; // Fallback an toàn
            return $"{request.Scheme}://{request.Host}";
        }

        public async Task<(bool Success, string ErrorMessage, string? ImageUrl)> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "Không tìm thấy file ảnh hợp lệ.", null);
            }

            try
            {
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
                
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var newFileName = Guid.NewGuid().ToString() + fileExtension;
                var filePath = Path.Combine(folderPath, newFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"{GetBaseUrl()}/images/{newFileName}";

                return (true, "", imageUrl);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lưu file: " + ex.Message, null);
            }
        }

        public async Task<(bool Success, string ErrorMessage, List<string>? ImageUrls)> UploadMultipleImagesAsync(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return (false, "Không tìm thấy file ảnh hợp lệ.", null);
            }

            try
            {
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var uploadedUrls = new List<string>();
                var baseUrl = GetBaseUrl();

                foreach (var file in files)
                {
                    if (file.Length > 0)
                    {
                        var fileExtension = Path.GetExtension(file.FileName);
                        var newFileName = Guid.NewGuid().ToString() + fileExtension;
                        var filePath = Path.Combine(folderPath, newFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        uploadedUrls.Add($"{baseUrl}/images/{newFileName}");
                    }
                }
                return (true, "", uploadedUrls);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lưu nhiều file: " + ex.Message, null);
            }
        }
    }
}
