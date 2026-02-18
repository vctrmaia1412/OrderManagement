using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Data.Mappings;

public class OrderMapping : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.OrderId);

        builder.Property(o => o.OrderDate)
            .IsRequired();

        builder.Property(o => o.TotalAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(o => o.Status)
            .HasMaxLength(30)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(o => o.RequiresManualApproval)
            .IsRequired();

        builder.Property(o => o.CreatedAt)
            .IsRequired();

        builder.HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.PaymentCondition)
            .WithMany(p => p.Orders)
            .HasForeignKey(o => o.PaymentConditionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.DeliveryTerm)
            .WithOne(d => d.Order)
            .HasForeignKey<DeliveryTerm>(d => d.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
