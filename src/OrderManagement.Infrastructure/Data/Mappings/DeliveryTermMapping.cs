using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Data.Mappings;

public class DeliveryTermMapping : IEntityTypeConfiguration<DeliveryTerm>
{
    public void Configure(EntityTypeBuilder<DeliveryTerm> builder)
    {
        builder.ToTable("DeliveryTerms");
        builder.HasKey(d => d.DeliveryTermId);

        builder.Property(d => d.EstimatedDeliveryDate)
            .IsRequired();

        builder.Property(d => d.DeliveryDays)
            .IsRequired();

        builder.Property(d => d.CreatedAt)
            .IsRequired();
    }
}
