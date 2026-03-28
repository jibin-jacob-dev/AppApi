using System.ComponentModel.DataAnnotations.Schema;

namespace EmpowerAPI.Models
{
    public class Training
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VideoUrl { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? Category { get; set; }
        public int? DurationMinutes { get; set; }
        public string Difficulty { get; set; } = "Medium"; // Easy, Medium, Hard
        
        public string? TrainerId { get; set; }
        [ForeignKey("TrainerId")]
        public User? Trainer { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
