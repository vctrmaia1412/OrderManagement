namespace OrderManagement.Domain.Entities;

public class DeliveryTerm
{
    public int DeliveryTermId { get; private set; }
    public int OrderId { get; private set; }
    public DateTime EstimatedDeliveryDate { get; private set; }
    public int DeliveryDays { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public Order Order { get; private set; } = null!;

    private DeliveryTerm() { }

    public DeliveryTerm(int deliveryDays)
    {
        DeliveryDays = deliveryDays;
        EstimatedDeliveryDate = DateTime.UtcNow.AddDays(deliveryDays);
        CreatedAt = DateTime.UtcNow;
    }
}
