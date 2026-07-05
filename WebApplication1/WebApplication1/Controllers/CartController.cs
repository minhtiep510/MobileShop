using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private int GetUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out int userId))
            {
                return userId;
            }
            throw new System.Exception("User ID không hợp lệ");
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                int userId = GetUserId();
                var cart = await _cartService.GetCartAsync(userId);
                return Ok(cart);
            }
            catch (System.Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            try
            {
                int userId = GetUserId();
                var (success, errorMsg) = await _cartService.AddToCartAsync(userId, dto);
                
                if (!success)
                {
                    return BadRequest(new { message = errorMsg });
                }

                return Ok(new { message = "Thêm vào giỏ hàng thành công" });
            }
            catch (System.Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPut("items/{id}")]
        public async Task<IActionResult> UpdateCartItem(int id, [FromBody] UpdateCartItemDto dto)
        {
            try
            {
                int userId = GetUserId();
                var (success, errorMsg) = await _cartService.UpdateCartItemAsync(userId, id, dto.Quantity);
                
                if (!success)
                {
                    return BadRequest(new { message = errorMsg });
                }

                return Ok(new { message = "Cập nhật giỏ hàng thành công" });
            }
            catch (System.Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpDelete("items/{id}")]
        public async Task<IActionResult> RemoveFromCart(int id)
        {
            try
            {
                int userId = GetUserId();
                var (success, errorMsg) = await _cartService.RemoveFromCartAsync(userId, id);
                
                if (!success)
                {
                    return BadRequest(new { message = errorMsg });
                }

                return Ok(new { message = "Xóa sản phẩm khỏi giỏ hàng thành công" });
            }
            catch (System.Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                int userId = GetUserId();
                var (success, errorMsg) = await _cartService.ClearCartAsync(userId);
                
                if (!success)
                {
                    return BadRequest(new { message = errorMsg });
                }

                return Ok(new { message = "Làm trống giỏ hàng thành công" });
            }
            catch (System.Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}
