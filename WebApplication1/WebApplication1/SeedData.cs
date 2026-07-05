using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using WebApplication1.Model;

namespace WebApplication1
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Kiểm tra xem đã có admin chưa
            var adminUser = await userManager.FindByEmailAsync("admin@example.com");
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = "admin@example.com",
                    Email = "admin@example.com",
                    FullName = "Administrator",
                    Role = "admin",
                    Address = "System",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123");
                if (!result.Succeeded)
                {
                    throw new Exception("Lỗi khi tạo tài khoản admin: " + string.Join(", ", result.Errors));
                }
            }
            else
            {
                // Nếu admin đã tồn tại, tự động reset mật khẩu về Admin@123 để tránh lỗi sai mật khẩu
                var token = await userManager.GeneratePasswordResetTokenAsync(adminUser);
                await userManager.ResetPasswordAsync(adminUser, token, "Admin@123");
                
                // Đảm bảo Role luôn được set là admin
                adminUser.Role = "admin";
                await userManager.UpdateAsync(adminUser);
            }
        }
    }
}
