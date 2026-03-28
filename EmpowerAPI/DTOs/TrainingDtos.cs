using EmpowerAPI.Models;

namespace EmpowerAPI.DTOs
{
    public class TrainingDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VideoUrl { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? Category { get; set; }
        public int? DurationMinutes { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public string? TrainerName { get; set; }
    }
    
    public class CreateTrainingDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VideoUrl { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? Category { get; set; }
        public int? DurationMinutes { get; set; }
        public string Difficulty { get; set; } = "Medium";
    }
}
