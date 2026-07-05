using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class UploadController : ControllerBase
    {
        private readonly IUploadService _uploadService;

        public UploadController(IUploadService uploadService)
        {
            _uploadService = uploadService;
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            var (success, errorMsg, imageUrl) = await _uploadService.UploadImageAsync(file);
            if (!success)
            {
                if (errorMsg.StartsWith("Không tìm thấy"))
                    return BadRequest(new { message = errorMsg });
                return StatusCode(500, new { message = errorMsg });
            }

            return Ok(new { url = imageUrl });
        }

        [HttpPost("multiple")]
        public async Task<IActionResult> UploadMultipleImages(List<IFormFile> files)
        {
            var (success, errorMsg, imageUrls) = await _uploadService.UploadMultipleImagesAsync(files);
            if (!success)
            {
                if (errorMsg.StartsWith("Không tìm thấy"))
                    return BadRequest(new { message = errorMsg });
                return StatusCode(500, new { message = errorMsg });
            }

            return Ok(new { urls = imageUrls });
        }
    }
}