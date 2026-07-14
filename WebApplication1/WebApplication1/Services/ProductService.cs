using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalStockAsync()
        {
            return await _context.ProductVariants.SumAsync(v => v.StockQuantity);
        }

        public async Task<PagedResult<ProductListDto>> GetAllAsync(int page = 1, int pageSize = 10, int? categoryId = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                    .ThenInclude(v => v.Images)
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductListDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    StartingPrice = p.ProductVariants
                        .OrderBy(v => v.Price)
                        .Select(v => v.Price)
                        .FirstOrDefault(),
                    ThumbnailUrl = p.ProductVariants
                        .SelectMany(v => v.Images)
                        .Where(i => i.IsMain)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return new PagedResult<ProductListDto>
            {
                Items = items,
                TotalCount = totalCount,
                TotalPages = (int)System.Math.Ceiling(totalCount / (double)pageSize),
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<object?> GetDetailAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                    .ThenInclude(v => v.Images)
                .Include(p => p.TechnicalSpecifications)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return null;

            return new 
            {
                id = product.Id,
                name = product.Name,
                description = product.Description,
                categoryId = product.CategoryId,
                categoryName = product.Category?.Name,
                variants = product.ProductVariants.Select(v => new 
                {
                    id = v.Id,
                    sku = v.SKU,
                    price = v.Price,
                    stockQuantity = v.StockQuantity,
                    color = v.Color,
                    size = v.Size,
                    condition = v.Condition,
                    images = v.Images.Select(i => new 
                    {
                        id = i.Id,
                        imageUrl = i.ImageUrl,
                        isMain = i.IsMain
                    }).ToList()
                }).ToList(),
                specifications = product.TechnicalSpecifications.Select(s => new 
                {
                    id = s.Id,
                    key = s.SpecName,
                    value = s.SpecValue
                }).ToList()
            };
        }

        public async Task<(bool Success, string ErrorMessage, object? Data)> CreateAsync(ProductCreateDto dto)
        {
            if (dto.Variants == null || !dto.Variants.Any())
                return (false, "Sản phẩm phải có ít nhất 1 biến thể.", null);

            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null)
                return (false, "Danh mục không tồn tại.", null);

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Description = (dto.Description ?? "").Trim(),
                CategoryId = dto.CategoryId,
                CreatedDate = DateTime.Now,
                ProductVariants = new List<ProductVariant>()
            };

            foreach (var vDto in dto.Variants)
            {
                var variant = new ProductVariant
                {
                    SKU = string.IsNullOrWhiteSpace(vDto.SKU) ? $"SKU-{DateTime.Now.Ticks}" : vDto.SKU,
                    Color = vDto.Color ?? "Mặc định",
                    Size = vDto.Size ?? "",
                    Condition = string.IsNullOrWhiteSpace(vDto.Condition) ? "Mới 100%" : vDto.Condition,
                    Price = vDto.Price,
                    StockQuantity = vDto.StockQuantity,
                    Images = new List<Image>()
                };

                if (vDto.Images != null && vDto.Images.Any())
                {
                    bool isFirst = true;
                    foreach (var img in vDto.Images)
                    {
                        if (!string.IsNullOrEmpty(img.ImageUrl))
                        {
                            variant.Images.Add(new Image
                            {
                                ImageUrl = img.ImageUrl,
                                IsMain = img.IsMain || isFirst
                            });
                            isFirst = false;
                        }
                    }
                }
                product.ProductVariants.Add(variant);
            }

            if (dto.Specifications != null && dto.Specifications.Any())
            {
                product.TechnicalSpecifications = dto.Specifications
                    .Where(s => !string.IsNullOrWhiteSpace(s.SpecName))
                    .Select(s => new TechnicalSpecification
                    {
                        SpecName = s.SpecName.Trim(),
                        SpecValue = s.SpecValue?.Trim() ?? ""
                    }).ToList();
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return (true, "", new 
            { 
                id = product.Id, 
                name = product.Name, 
                description = product.Description,
                categoryId = product.CategoryId,
                variantsCount = product.ProductVariants.Count,
                message = "Đã thêm sản phẩm và các biến thể thành công"
            });
        }

        public async Task<(bool Success, string ErrorMessage, object? Data)> UpdateAsync(int id, ProductCreateDto dto)
        {
            if (dto.CategoryId <= 0)
                return (false, "Danh mục không hợp lệ", null);

            var product = await _context.Products
                .Include(p => p.TechnicalSpecifications)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return (false, "Sản phẩm không tồn tại", null);

            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null)
                return (false, "Danh mục không tồn tại", null);

            product.Name = dto.Name.Trim();
            product.Description = dto.Description?.Trim() ?? "";
            product.CategoryId = dto.CategoryId;

            if (dto.Specifications != null)
            {
                if (product.TechnicalSpecifications.Any())
                {
                    _context.TechnicalSpecifications.RemoveRange(product.TechnicalSpecifications);
                }
                
                product.TechnicalSpecifications = dto.Specifications
                    .Where(s => !string.IsNullOrWhiteSpace(s.SpecName))
                    .Select(s => new TechnicalSpecification
                    {
                        SpecName = s.SpecName.Trim(),
                        SpecValue = s.SpecValue?.Trim() ?? ""
                    }).ToList();
            }

            await _context.SaveChangesAsync();

            return (true, "", new { 
                id = product.Id, 
                name = product.Name, 
                description = product.Description,
                categoryId = product.CategoryId,
                message = "Cập nhật sản phẩm thành công"
            });
        }

        public async Task<(bool Success, string ErrorMessage)> DeleteAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.ProductVariants)
                    .ThenInclude(v => v.Images)
                .Include(p => p.TechnicalSpecifications)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return (false, "Sản phẩm không tồn tại.");

            var variantIds = product.ProductVariants.Select(v => v.Id).ToList();
            var isProductInAnyOrder = await _context.OrderDetails
                .AnyAsync(od => variantIds.Contains(od.ProductVariantId));

            if (isProductInAnyOrder)
                return (false, "Không thể xóa sản phẩm này vì đã có trong một hoặc nhiều đơn hàng đã đặt.");

            var imagesToDelete = product.ProductVariants.SelectMany(v => v.Images).ToList();

            if (imagesToDelete.Any()) _context.Images.RemoveRange(imagesToDelete);
            if (product.TechnicalSpecifications.Any()) _context.TechnicalSpecifications.RemoveRange(product.TechnicalSpecifications);
            if (product.ProductVariants.Any()) _context.ProductVariants.RemoveRange(product.ProductVariants);
            _context.Products.Remove(product);

            await _context.SaveChangesAsync();

            foreach (var image in imagesToDelete)
            {
                try
                {
                    var fileName = Path.GetFileName(new Uri(image.ImageUrl).AbsolutePath);
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", fileName);
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi không thể xóa file {image.ImageUrl}: {ex.Message}");
                }
            }

            return (true, "Xóa sản phẩm thành công.");
        }

        public async Task<(bool Success, string ErrorMessage)> CreateVariantAsync(int productId, ProductVariantDto dto)
        {
            var skuToCheck = string.IsNullOrWhiteSpace(dto.SKU) ? $"SKU-{DateTime.Now.Ticks}" : dto.SKU;

            var variant = new ProductVariant
            {
                ProductId = productId,
                SKU = skuToCheck,
                Color = dto.Color ?? "Mặc định",
                Size = dto.Size ?? "",
                Condition = string.IsNullOrWhiteSpace(dto.Condition) ? "Mới 100%" : dto.Condition,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity 
            };

            _context.ProductVariants.Add(variant);
            await _context.SaveChangesAsync();

            if (dto.Images != null && dto.Images.Any())
            {
                bool isFirst = true;
                foreach (var img in dto.Images)
                {
                    if (!string.IsNullOrEmpty(img.ImageUrl))
                    {
                        _context.Images.Add(new Image
                        {
                            ProductVariantId = variant.Id,
                            ImageUrl = img.ImageUrl,
                            IsMain = img.IsMain || isFirst
                        });
                        isFirst = false;
                    }
                }
                await _context.SaveChangesAsync();  
            }

            return (true, "Tạo variant + ảnh thành công");
        }

        public async Task<(bool Success, string ErrorMessage)> UpdateVariantAsync(int id, ProductVariantDto dto)
        {
            var variant = await _context.ProductVariants
                .Include(v => v.Images)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (variant == null)
                return (false, "Biến thể không tồn tại");

            var newSku = string.IsNullOrWhiteSpace(dto.SKU) ? variant.SKU : dto.SKU;
            variant.SKU = newSku;
            variant.Color = dto.Color ?? variant.Color;
            variant.Size = dto.Size ?? "";
            variant.Condition = string.IsNullOrWhiteSpace(dto.Condition) ? variant.Condition : dto.Condition;
            variant.Price = dto.Price;
            variant.StockQuantity = dto.StockQuantity;

            _context.Images.RemoveRange(variant.Images);

            if (dto.Images != null && dto.Images.Any())
            {
                bool isFirst = true;
                foreach (var img in dto.Images)
                {
                    if (!string.IsNullOrEmpty(img.ImageUrl))
                    {
                        _context.Images.Add(new Image
                        {
                            ProductVariantId = variant.Id,
                            ImageUrl = img.ImageUrl,
                            IsMain = img.IsMain || isFirst
                        });
                        isFirst = false;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return (true, "Cập nhật variant + ảnh thành công");
        }

        public async Task<(bool Success, string ErrorMessage)> DeleteVariantAsync(int id)
        {
            var variant = await _context.ProductVariants
                .Include(v => v.Images)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (variant == null)
                return (false, "Không tìm thấy variant");

            _context.Images.RemoveRange(variant.Images);
            _context.ProductVariants.Remove(variant);

            await _context.SaveChangesAsync();
            return (true, "Đã xóa variant + ảnh");
        }
    }
}
