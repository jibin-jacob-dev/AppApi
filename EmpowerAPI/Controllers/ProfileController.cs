using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using EmpowerAPI.Data;
using EmpowerAPI.DTOs;
using EmpowerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EmpowerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IWebHostEnvironment _env;

        public ProfileController(UserManager<User> userManager, IWebHostEnvironment env)
        {
            _userManager = userManager;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found.");

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                ProfileImageUrl = user.ProfileImageUrl,
                Address = user.Address,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender,
                HeightCm = user.HeightCm,
                WeightKg = user.WeightKg,
                Role = user.Role
            });
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return NotFound("User not found.");

                if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

                // Ensure upload directory exists
                var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                Console.WriteLine($"[DEBUG] ContentRoot: {_env.ContentRootPath}, WebRoot: {webRoot}");

                var uploadsFolder = Path.Combine(webRoot, "uploads", "profiles");
                if (!Directory.Exists(uploadsFolder)) 
                {
                    Console.WriteLine($"[DEBUG] Creating directory: {uploadsFolder}");
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate unique filename
                var extension = file.FileName != null ? Path.GetExtension(file.FileName) : ".jpg";
                var uniqueFileName = $"{userId}_{DateTime.UtcNow.Ticks}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Update user profile image URL
                // We assume the app serves from the base URL of the request
                var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
                user.ProfileImageUrl = $"{baseUrl}/uploads/profiles/{uniqueFileName}";
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded) return BadRequest("Failed to update user image record.");

                return Ok(new { imageUrl = user.ProfileImageUrl });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UploadImage: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, $"Internal server error during image upload: {ex.Message}");
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UserDto updateDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null) return Unauthorized();

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return NotFound("User not found.");

                // Log incoming data
                Console.WriteLine($"Updating user {user.Email}: FullName='{updateDto.FullName}', PhoneNumber='{updateDto.PhoneNumber}', Address='{updateDto.Address}', Height='{updateDto.HeightCm}', Weight='{updateDto.WeightKg}', Gender='{updateDto.Gender}', DOB='{updateDto.DateOfBirth}'");

                user.FullName = updateDto.FullName;
                user.ProfileImageUrl = updateDto.ProfileImageUrl;
                user.Address = updateDto.Address;
                user.PhoneNumber = updateDto.PhoneNumber;
                user.DateOfBirth = updateDto.DateOfBirth;
                user.Gender = updateDto.Gender;
                user.HeightCm = updateDto.HeightCm;
                user.WeightKg = updateDto.WeightKg;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    Console.WriteLine($"Update failed: {errors}");
                    return BadRequest($"Failed to update profile: {errors}");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateProfile: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, "Internal server error during profile update.");
            }
        }
    }
}
