using System.Security.Claims;
using EmpowerAPI.Data;
using EmpowerAPI.DTOs;
using EmpowerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmpowerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TrainingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TrainingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingDto>>> GetTrainings()
        {
            var trainings = await _context.Trainings
                .Include(t => t.Trainer)
                .Where(t => t.IsActive)
                .Select(t => new TrainingDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    VideoUrl = t.VideoUrl,
                    ThumbnailUrl = t.ThumbnailUrl,
                    Category = t.Category,
                    DurationMinutes = t.DurationMinutes,
                    Difficulty = t.Difficulty,
                    TrainerName = t.Trainer != null ? t.Trainer.FullName : null
                })
                .ToListAsync();

            return Ok(trainings);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingDto>> GetTraining(int id)
        {
            var t = await _context.Trainings
                .Include(tr => tr.Trainer)
                .FirstOrDefaultAsync(tr => tr.Id == id);

            if (t == null || !t.IsActive)
            {
                return NotFound();
            }

            return new TrainingDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                Category = t.Category,
                DurationMinutes = t.DurationMinutes,
                Difficulty = t.Difficulty,
                TrainerName = t.Trainer != null ? t.Trainer.FullName : null
            };
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<TrainingDto>> CreateTraining(CreateTrainingDto dto)
        {
            var trainerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var training = new Training
            {
                Title = dto.Title,
                Description = dto.Description,
                VideoUrl = dto.VideoUrl,
                ThumbnailUrl = dto.ThumbnailUrl,
                Category = dto.Category,
                DurationMinutes = dto.DurationMinutes,
                Difficulty = dto.Difficulty,
                TrainerId = trainerId
            };

            _context.Trainings.Add(training);
            await _context.SaveChangesAsync();

            var createdDto = new TrainingDto
            {
                Id = training.Id,
                Title = training.Title,
                Description = training.Description,
                VideoUrl = training.VideoUrl,
                ThumbnailUrl = training.ThumbnailUrl,
                Category = training.Category,
                DurationMinutes = training.DurationMinutes,
                Difficulty = training.Difficulty
            };

            return CreatedAtAction(nameof(GetTraining), new { id = training.Id }, createdDto);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateTraining(int id, CreateTrainingDto dto)
        {
            var training = await _context.Trainings.FindAsync(id);

            if (training == null || !training.IsActive)
            {
                return NotFound();
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isUserAdmin = User.IsInRole("Admin");

            // Only allow the original trainer or an admin to update
            if (!isUserAdmin && training.TrainerId != currentUserId)
            {
                return Forbid();
            }

            training.Title = dto.Title;
            training.Description = dto.Description;
            training.VideoUrl = dto.VideoUrl;
            training.ThumbnailUrl = dto.ThumbnailUrl;
            training.Category = dto.Category;
            training.DurationMinutes = dto.DurationMinutes;
            training.Difficulty = dto.Difficulty;
            training.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteTraining(int id)
        {
            var training = await _context.Trainings.FindAsync(id);
            if (training == null)
            {
                return NotFound();
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isUserAdmin = User.IsInRole("Admin");

            // Only allow the original trainer or an admin to delete
            if (!isUserAdmin && training.TrainerId != currentUserId)
            {
                return Forbid();
            }

            // Soft delete
            training.IsActive = false;
            training.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
