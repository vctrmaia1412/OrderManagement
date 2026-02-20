using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Data.Mappings;

public class UserMapping : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.UserId);
        builder.Property(u => u.Username).HasMaxLength(50).IsRequired();
        builder.HasIndex(u => u.Username).IsUnique();
        builder.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
        builder.Property(u => u.FullName).HasMaxLength(150).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Role).HasMaxLength(20).IsRequired().HasDefaultValue("User");
        builder.Property(u => u.IsActive).HasDefaultValue(true);
    }
}
