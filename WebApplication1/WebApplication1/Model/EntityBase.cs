using System;
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Model
{
    public abstract class EntityBase
    {
        [Key]
        public int Id { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }
}
