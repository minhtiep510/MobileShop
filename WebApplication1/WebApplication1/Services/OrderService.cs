using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;

        public OrderService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<object>> GetAllAsync(int page = 1, int pageSize = 10, string searchTerm = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .OrderByDescending(o => o.OrderDate)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(o => 
                    o.Id.ToString() == searchTerm || 
                    (o.User != null && o.User.FullName.Contains(searchTerm)) || 
                    (o.User != null && o.User.PhoneNumber.Contains(searchTerm)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.Id,
                    CustomerName = o.User != null ? o.User.FullName : "N/A",
                    Phone = o.User != null ? o.User.PhoneNumber : "N/A",
                    Date = o.OrderDate,
                    o.TotalAmount,
                    Status = o.Status.ToLower(),
                    PaymentMethod = o.PaymentMethod,
                    PaymentStatus = o.PaymentStatus
                })
                .ToListAsync();

            return new PagedResult<object>
            {
                Items = items,
                TotalCount = totalCount,
                TotalPages = (int)System.Math.Ceiling(totalCount / (double)pageSize),
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<PagedResult<object>> GetMyOrdersAsync(int userId, int page = 1, int pageSize = 10)
        {
            var query = _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                        .ThenInclude(v => v.Images)
                .OrderByDescending(o => o.OrderDate)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.Id,
                    CustomerName = o.User != null ? o.User.FullName : "N/A",
                    Phone = o.User != null ? o.User.PhoneNumber : "N/A",
                    OrderDate = o.OrderDate,
                    o.TotalAmount,
                    ShippingAddress = o.ShippingAddress,
                    Status = o.Status.ToLower(),
                    PaymentMethod = o.PaymentMethod,
                    PaymentStatus = o.PaymentStatus,
                    Items = o.OrderDetails.Select(d => new OrderDetailDto
                    {
                        ProductVariantId = d.ProductVariantId,
                        ProductId = d.ProductVariant != null ? d.ProductVariant.ProductId : 0,
                        ProductName = d.ProductVariant != null && d.ProductVariant.Product != null ? d.ProductVariant.Product.Name : "Unknown",
                        Color = d.ProductVariant != null ? d.ProductVariant.Color : "",
                        Size = d.ProductVariant != null ? d.ProductVariant.Size : "",
                        Quantity = d.Quantity,
                        Price = d.UnitPrice,
                        ProductImage = d.ProductVariant != null && d.ProductVariant.Images != null ? 
                            d.ProductVariant.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault() ?? "" : "",
                        Sku = d.ProductVariant != null ? d.ProductVariant.SKU : ""
                    }).ToList()
                })
                .ToListAsync();

            return new PagedResult<object>
            {
                Items = items,
                TotalCount = totalCount,
                TotalPages = (int)System.Math.Ceiling(totalCount / (double)pageSize),
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<OrderItemResponseDto?> GetDetailAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                        .ThenInclude(v => v.Images)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return null;

            return new OrderItemResponseDto
            {
                Id = order.Id,
                UserId = order.UserId,
                CustomerName = order.User != null ? order.User.FullName : "N/A",
                Phone = order.User != null ? order.User.PhoneNumber : "N/A",
                ShippingAddress = order.ShippingAddress,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToLower(),
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentStatus,
                Items = order.OrderDetails.Select(d => new OrderDetailDto
                {
                    ProductVariantId = d.ProductVariantId,
                    ProductId = d.ProductVariant?.ProductId ?? 0,
                    ProductName = d.ProductVariant?.Product?.Name ?? "Unknown",
                    Color = d.ProductVariant?.Color ?? "",
                    Size = d.ProductVariant?.Size ?? "",
                    Quantity = d.Quantity,
                    Price = d.UnitPrice,
                    ProductImage = d.ProductVariant?.Images?
                        .Where(i => i.IsMain)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault() ?? "",
                    Sku = d.ProductVariant?.SKU ?? ""
                }).ToList()
            };
        }

        public async Task<(bool Success, object? Data)> UpdateStatusAsync(int id, string status)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return (false, null);

            // Restore inventory if order is being cancelled
            if (status.ToLower() == "cancelled" && order.Status.ToLower() != "cancelled")
            {
                foreach (var detail in order.OrderDetails)
                {
                    if (detail.ProductVariant != null)
                    {
                        detail.ProductVariant.StockQuantity += detail.Quantity;
                    }
                }
            }
            // Deduct inventory if order is being un-cancelled
            else if (order.Status.ToLower() == "cancelled" && status.ToLower() != "cancelled")
            {
                foreach (var detail in order.OrderDetails)
                {
                    if (detail.ProductVariant != null)
                    {
                        detail.ProductVariant.StockQuantity -= detail.Quantity;
                    }
                }
            }

            order.Status = status;
            await _context.SaveChangesAsync();

            return (true, order);
        }

        public async Task<(bool Success, object? Data)> UpdatePaymentStatusAsync(int id, string paymentStatus)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return (false, null);

            order.PaymentStatus = paymentStatus;
            await _context.SaveChangesAsync();

            return (true, order);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return false;

            // Restore inventory if order wasn't already cancelled before deletion
            if (order.Status.ToLower() != "cancelled")
            {
                foreach (var detail in order.OrderDetails)
                {
                    if (detail.ProductVariant != null)
                    {
                        detail.ProductVariant.StockQuantity += detail.Quantity;
                    }
                }
            }

            _context.OrderDetails.RemoveRange(order.OrderDetails);
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<(bool Success, string ErrorMessage, int? OrderId)> CheckoutAsync(int userId, CheckoutDto dto)
        {
            // 1. Lấy giỏ hàng
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.Items.Any())
            {
                return (false, "Giỏ hàng trống", null);
            }

            // 2. Bắt đầu Transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Kiểm tra tồn kho
                foreach (var item in cart.Items)
                {
                    if (item.ProductVariant.StockQuantity < item.Quantity)
                    {
                        return (false, $"Sản phẩm {item.ProductVariant.SKU} không đủ số lượng (còn {item.ProductVariant.StockQuantity})", null);
                    }
                }

                // Cập nhật sđt user nếu có truyền vào
                var user = await _context.Users.FindAsync(userId);
                if (user != null && !string.IsNullOrEmpty(dto.Phone))
                {
                    user.PhoneNumber = dto.Phone;
                }

                // 3. Tạo Đơn hàng mới
                decimal totalAmount = cart.Items.Sum(i => i.ProductVariant.Price * i.Quantity) + dto.ShippingFee;
                
                var order = new Order
                {
                    UserId = userId,
                    OrderDate = System.DateTime.Now,
                    TotalAmount = totalAmount,
                    Status = "pending",
                    ShippingAddress = dto.ShippingAddress,
                    PaymentMethod = string.IsNullOrEmpty(dto.PaymentMethod) ? "COD" : dto.PaymentMethod,
                    PaymentStatus = "Unpaid"
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(); // Lưu để lấy Order.Id

                // 4. Tạo Order Details và Trừ Tồn kho
                foreach (var item in cart.Items)
                {
                    var orderDetail = new OrderDetail
                    {
                        OrderId = order.Id,
                        ProductVariantId = item.ProductVariantId,
                        Quantity = item.Quantity,
                        UnitPrice = item.ProductVariant.Price
                    };
                    _context.OrderDetails.Add(orderDetail);

                    // Trừ tồn kho
                    item.ProductVariant.StockQuantity -= item.Quantity;
                }

                // 5. Làm trống giỏ hàng
                _context.CartItems.RemoveRange(cart.Items);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, string.Empty, order.Id);
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return (false, "Sản phẩm bạn đã hết hàng. Vui lòng kiểm tra lại giỏ hàng.", null);
            }
            catch (System.Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Lỗi khi đặt hàng: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string ErrorMessage)> CancelOrderAsync(int orderId, int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderDetails)
                        .ThenInclude(d => d.ProductVariant)
                    .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

                if (order == null)
                {
                    return (false, "Không tìm thấy đơn hàng.");
                }

                if (order.Status.ToLower() != "pending")
                {
                    return (false, "Chỉ có thể hủy đơn hàng khi đang ở trạng thái 'Đang xử lý'.");
                }

                // Cập nhật trạng thái
                order.Status = "cancelled";

                // Hoàn lại số lượng tồn kho
                foreach (var detail in order.OrderDetails)
                {
                    if (detail.ProductVariant != null)
                    {
                        detail.ProductVariant.StockQuantity += detail.Quantity;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, string.Empty);
            }
            catch (System.Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Lỗi khi hủy đơn hàng: {ex.Message}");
            }
        }
    }
}
