using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebApplication1.Services.Interfaces
{
    public interface IUploadService
    {
        Task<(bool Success, string ErrorMessage, string? ImageUrl)> UploadImageAsync(IFormFile file);
        Task<(bool Success, string ErrorMessage, List<string>? ImageUrls)> UploadMultipleImagesAsync(List<IFormFile> files);
    }
}
