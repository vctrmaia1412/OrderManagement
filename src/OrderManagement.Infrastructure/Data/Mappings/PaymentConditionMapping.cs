using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Data.Mappings;

public class PaymentConditionMapping : IEntityTypeConfiguration<PaymentCondition>
{
    public void Configure(EntityTypeBuilder<PaymentCondition> builder)
    {
        builder.ToTable("PaymentConditions");
        builder.HasKey(p => p.PaymentConditionId);

        builder.Property(p => p.Description)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(p => p.NumberOfInstallments)
            .IsRequired();

        builder.Property(p => p.CreatedAt)
            .IsRequired();
    }
}
