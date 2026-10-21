using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.DTOs;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SepayController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SepayController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook([FromBody] SepayWebhookDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { success = false, message = "Payload trống" });
            }

            Console.WriteLine($"[SEPAY WEBHOOK NHẬN ĐƯỢC]: Số tiền = {dto.transferAmount}, Nội dung = {dto.content}");

            // Chỉ xử lý các giao dịch TIỀN VÀO (in)
            if (dto.transferType != null && dto.transferType.ToLower() != "in")
            {
                return Ok(new { success = true, message = "Bỏ qua giao dịch tiền ra" });
            }

            // Tìm mã đơn hàng từ nội dung chuyển tiền (Ví dụ: "DH15" hoặc "DH 15" hoặc "DH-15")
            var content = (dto.content ?? "") + " " + (dto.description ?? "");
            var match = Regex.Match(content, @"DH[-_\s]?(\d+)", RegexOptions.IgnoreCase);

            if (!match.Success)
            {
                return Ok(new { success = false, message = "Không tìm thấy mã đơn hàng DH trong nội dung" });
            }

            var orderIdStr = match.Groups[1].Value;
            if (!int.TryParse(orderIdStr, out int orderId))
            {
                return Ok(new { success = false, message = "Mã đơn hàng không hợp lệ" });
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
            {
                return Ok(new { success = false, message = $"Không tìm thấy đơn hàng #{orderId}" });
            }

            // Nếu đơn hàng đã thanh toán rồi thì không cần cập nhật lại
            if (order.PaymentStatus == "Paid")
            {
                return Ok(new { success = true, message = "Đơn hàng đã được thanh toán trước đó" });
            }

            // Cập nhật trạng thái đơn hàng thành Paid
            order.PaymentStatus = "Paid";
            if (order.Status.ToLower() == "pending")
            {
                order.Status = "processing"; // Tự động chuyển sang Đang chuẩn bị hàng
            }

            await _context.SaveChangesAsync();

            Console.WriteLine($"[SEPAY THÀNH CÔNG]: Đơn hàng #{order.Id} đã được tự động xác nhận thanh toán!");

            return Ok(new { success = true, message = $"Đã cập nhật đơn hàng #{order.Id} thành công", orderId = order.Id });
        }

        [HttpGet("check-status/{orderId}")]
        public async Task<IActionResult> CheckPaymentStatus(int orderId)
        {
            var order = await _context.Orders
                .Select(o => new { o.Id, o.PaymentStatus, o.Status })
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            return Ok(new 
            { 
                orderId = order.Id,
                isPaid = order.PaymentStatus == "Paid",
                paymentStatus = order.PaymentStatus,
                status = order.Status
            });
        }
    }
}

