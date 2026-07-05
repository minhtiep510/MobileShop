using Microsoft.AspNetCore.Mvc;
using WebApplication1.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using WebApplication1.DTOs;
using System.Security.Claims;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var orders = await _orderService.GetAllAsync(page, pageSize);
            return Ok(orders);
        }

        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "User ID không hợp lệ" });
            }

            var orders = await _orderService.GetMyOrdersAsync(userId, page, pageSize);
            return Ok(orders);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetDetail(int id)
        {
            var result = await _orderService.GetDetailAsync(id);
            if (result == null)
                return NotFound();

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (role != "admin")
            {
                if (!int.TryParse(userIdStr, out int currentUserId) || result.UserId != currentUserId)
                {
                    return Forbid();
                }
            }

            return Ok(result);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var (success, data) = await _orderService.UpdateStatusAsync(id, status);
            if (!success)
                return NotFound();

            return Ok(data);
        }

        [HttpPut("{id}/payment-status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] string paymentStatus)
        {
            var (success, data) = await _orderService.UpdatePaymentStatusAsync(id, paymentStatus);
            if (!success)
                return NotFound();

            return Ok(data);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _orderService.DeleteAsync(id);
            if (!success)
                return NotFound();

            return Ok("Deleted");
        }

        [HttpPost("checkout")]
        [Authorize]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "User ID không hợp lệ" });
            }

            var (success, errorMsg, orderId) = await _orderService.CheckoutAsync(userId, dto);
            if (!success)
            {
                return BadRequest(new { message = errorMsg });
            }

            return Ok(new { message = "Đặt hàng thành công", orderId = orderId });
        }

        [HttpPut("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "User ID không hợp lệ" });
            }

            var (success, errorMsg) = await _orderService.CancelOrderAsync(id, userId);
            if (!success)
            {
                return BadRequest(new { message = errorMsg });
            }

            return Ok(new { message = "Hủy đơn hàng thành công" });
        }
    }
}