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
    [Authorize(Roles = "admin")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("total")]
        public async Task<IActionResult> GetUserCount()
        {
            try
            {
                var count = await _userService.GetUserCountAsync();
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error counting users: {ex.Message}");
                return StatusCode(500, new { message = "Error counting users", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                _logger.LogInformation("Fetching all users");
                var users = await _userService.GetAllAsync(page, pageSize);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching users: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                _logger.LogInformation($"Fetching user with ID: {id}");
                var result = await _userService.GetByIdAsync(id);

                if (result == null)
                {
                    _logger.LogWarning($"User with ID {id} not found");
                    return NotFound(new { message = "User not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching user {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching user", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserDto dto)
        {
            try
            {
                _logger.LogInformation($"Creating new user: {dto.Email}");
                var (success, errorMsg, data) = await _userService.CreateAsync(dto);

                if (!success)
                    return BadRequest(new { message = errorMsg });

                _logger.LogInformation($"User created successfully with ID: {data?.Id}");
                return CreatedAtAction(nameof(GetById), new { id = data?.Id }, data);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating user: {ex.Message}");
                return StatusCode(500, new { message = "Error creating user", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserDto dto)
        {
            try
            {
                _logger.LogInformation($"Updating user with ID: {id}");
                var (success, errorMsg) = await _userService.UpdateAsync(id, dto);

                if (!success)
                {
                    if (errorMsg == "User not found")
                        return NotFound(new { message = errorMsg });
                    return BadRequest(new { message = errorMsg });
                }

                _logger.LogInformation($"User {id} updated successfully");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error updating user", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                _logger.LogInformation($"Deleting user with ID: {id}");
                var (success, errorMsg) = await _userService.DeleteAsync(id);

                if (!success)
                {
                    if (errorMsg == "User not found")
                        return NotFound(new { message = errorMsg });
                    return BadRequest(new { message = errorMsg });
                }

                _logger.LogInformation($"User {id} deleted successfully");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting user {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }
    }
}