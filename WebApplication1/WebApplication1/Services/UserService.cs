using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.DTOs;
using WebApplication1.Model;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetUserCountAsync()
        {
            return await _context.Users.CountAsync();
        }

        public async Task<PagedResult<UserDto>> GetAllAsync(int page = 1, int pageSize = 10)
        {
            var query = _context.Users.AsQueryable();
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Address = u.Address,
                    Role = u.Role
                })
                .ToListAsync();

            return new PagedResult<UserDto>
            {
                Items = items,
                TotalCount = totalCount,
                TotalPages = (int)System.Math.Ceiling(totalCount / (double)pageSize),
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Role = user.Role
            };
        }

        public async Task<(bool Success, string ErrorMessage, UserDto? Data)> CreateAsync(UserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return (false, "Họ tên không được trống", null);

            if (string.IsNullOrWhiteSpace(dto.Email))
                return (false, "Email không được trống", null);

            var emailValidator = new EmailAddressAttribute();
            if (!emailValidator.IsValid(dto.Email))
                return (false, "Email không hợp lệ", null);

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (existingUser != null)
                return (false, "Email đã tồn tại trong hệ thống", null);

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(dto.PhoneNumber, @"^\d{9,15}$"))
                    return (false, "Số điện thoại không hợp lệ", null);
            }

            var user = new ApplicationUser
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLower(),
                UserName = dto.Email.Trim().ToLower(),
                PhoneNumber = dto.PhoneNumber?.Trim(),
                Address = dto.Address?.Trim(),
                Role = string.IsNullOrWhiteSpace(dto.Role) ? "customer" : dto.Role.ToLower(),
                PasswordHash = "default_hash"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var responseDto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Role = user.Role
            };

            return (true, "", responseDto);
        }

        public async Task<(bool Success, string ErrorMessage)> UpdateAsync(int id, UserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return (false, "Họ tên không được trống");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return (false, "Email không được trống");

            var emailValidator = new EmailAddressAttribute();
            if (!emailValidator.IsValid(dto.Email))
                return (false, "Email không hợp lệ");

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(dto.PhoneNumber, @"^\d{9,15}$"))
                    return (false, "Số điện thoại không hợp lệ");
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return (false, "User not found");

            var emailExists = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != id);
            if (emailExists != null)
                return (false, "Email đã được sử dụng bởi người dùng khác");

            user.FullName = dto.FullName.Trim();
            user.Email = dto.Email.Trim().ToLower();
            user.UserName = dto.Email.Trim().ToLower();
            user.PhoneNumber = dto.PhoneNumber?.Trim();
            user.Address = dto.Address?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Role))
                user.Role = dto.Role.ToLower();

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return (true, "");
        }

        public async Task<(bool Success, string ErrorMessage)> DeleteAsync(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return (false, "User not found");

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return (true, "");
            }
            catch (DbUpdateException ex)
            {
                return (false, "Cannot delete user: User has related orders");
            }
        }
    }
}
