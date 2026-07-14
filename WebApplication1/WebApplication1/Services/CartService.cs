using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class CartService : ICartService
    {
        private readonly AppDbContext _context;

        public CartService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CartDto> GetCartAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                .ThenInclude(pv => pv.Product)
                .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                .ThenInclude(pv => pv.Images)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            var dto = new CartDto
            {
                Id = cart.Id,
                UserId = cart.UserId,
                Items = cart.Items.Select(i => new CartItemDto
                {
                    Id = i.Id,
                    ProductVariantId = i.ProductVariantId,
                    ProductName = i.ProductVariant.Product.Name,
                    ProductImage = i.ProductVariant.Images.FirstOrDefault()?.ImageUrl,
                    SKU = i.ProductVariant.SKU,
                    Color = i.ProductVariant.Color,
                    Size = i.ProductVariant.Size,
                    Price = i.ProductVariant.Price,
                    Quantity = i.Quantity
                }).ToList()
            };

            dto.TotalPrice = dto.Items.Sum(i => i.SubTotal);
            return dto;
        }

        public async Task<(bool Success, string ErrorMessage)> AddToCartAsync(int userId, AddToCartDto dto)
        {
            var variant = await _context.ProductVariants.FindAsync(dto.ProductVariantId);
            if (variant == null)
            {
                return (false, "Sản phẩm không tồn tại");
            }

            if (variant.StockQuantity < dto.Quantity)
            {
                return (false, "Số lượng tồn kho không đủ");
            }

            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
            }

            var existingItem = cart.Items.FirstOrDefault(i => i.ProductVariantId == dto.ProductVariantId);
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                if (existingItem.Quantity > variant.StockQuantity)
                {
                    return (false, "Số lượng vượt quá tồn kho");
                }
            }
            else
            {
                cart.Items.Add(new CartItem
                {
                    ProductVariantId = dto.ProductVariantId,
                    Quantity = dto.Quantity
                });
            }

            await _context.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<(bool Success, string ErrorMessage)> UpdateCartItemAsync(int userId, int cartItemId, int quantity)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return (false, "Giỏ hàng trống");

            var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId);
            if (item == null) return (false, "Sản phẩm không có trong giỏ");

            if (quantity <= 0)
            {
                _context.CartItems.Remove(item);
            }
            else
            {
                if (item.ProductVariant.StockQuantity < quantity)
                {
                    return (false, "Số lượng vượt quá tồn kho");
                }
                item.Quantity = quantity;
            }

            await _context.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<(bool Success, string ErrorMessage)> RemoveFromCartAsync(int userId, int cartItemId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return (false, "Giỏ hàng trống");

            var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId);
            if (item == null) return (false, "Sản phẩm không có trong giỏ");

            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();

            return (true, string.Empty);
        }

        public async Task<(bool Success, string ErrorMessage)> ClearCartAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return (true, string.Empty); // Đã trống sẵn

            _context.CartItems.RemoveRange(cart.Items);
            await _context.SaveChangesAsync();

            return (true, string.Empty);
        }
    }
}
