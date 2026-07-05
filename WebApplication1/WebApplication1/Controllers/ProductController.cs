using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet("total-stock")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetTotalStock()
        {
            var totalStock = await _productService.GetTotalStockAsync();
            return Ok(new { totalStock });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] int? categoryId = null)
        {
            var products = await _productService.GetAllAsync(page, pageSize, categoryId);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var result = await _productService.GetDetailAsync(id);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var (success, errorMsg, data) = await _productService.CreateAsync(dto);
                if (!success)
                    return BadRequest(errorMsg);

                return Ok(data);
            }
            catch (Exception)
            {
                return StatusCode(500, "Đã xảy ra lỗi trong quá trình thêm sản phẩm.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var (success, errorMsg, data) = await _productService.UpdateAsync(id, dto);
                if (!success)
                {
                    if (errorMsg == "Sản phẩm không tồn tại")
                        return NotFound(errorMsg);
                    return BadRequest(errorMsg);
                }

                return Ok(data);
            }
            catch (Exception)
            {
                return StatusCode(500, "Đã xảy ra lỗi trong quá trình cập nhật sản phẩm.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var (success, errorMsg) = await _productService.DeleteAsync(id);
                if (!success)
                {
                    if (errorMsg == "Sản phẩm không tồn tại.")
                        return NotFound(errorMsg);
                    return BadRequest(errorMsg);
                }

                return Ok(errorMsg);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi cơ sở dữ liệu khi xóa sản phẩm: {ex.Message}");
            }
        }

        [HttpPost("{productId}/variants")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateVariant(int productId, [FromBody] ProductVariantDto dto)
        {
            try
            {
                var (success, errorMsg) = await _productService.CreateVariantAsync(productId, dto);
                if (!success)
                    return BadRequest(new { message = errorMsg });

                return Ok(new { message = errorMsg });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpPut("variant/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateVariant(int id, [FromBody] ProductVariantDto dto)
        {
            try
            {
                var (success, errorMsg) = await _productService.UpdateVariantAsync(id, dto);
                if (!success)
                {
                    if (errorMsg == "Biến thể không tồn tại")
                        return NotFound(new { message = errorMsg });
                    return BadRequest(new { message = errorMsg });
                }

                return Ok(new { message = errorMsg });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpDelete("variant/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteVariant(int id)
        {
            var (success, errorMsg) = await _productService.DeleteVariantAsync(id);
            if (!success)
                return NotFound();

            return Ok(errorMsg);
        }
    }
}
