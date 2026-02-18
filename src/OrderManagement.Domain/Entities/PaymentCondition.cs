namespace OrderManagement.Domain.Entities;

public class PaymentCondition
{
    public int PaymentConditionId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public int NumberOfInstallments { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public ICollection<Order> Orders { get; private set; } = new List<Order>();

    private PaymentCondition() { }

    public PaymentCondition(string description, int numberOfInstallments)
    {
        Description = description;
        NumberOfInstallments = numberOfInstallments;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string description, int numberOfInstallments)
    {
        Description = description;
        NumberOfInstallments = numberOfInstallments;
    }
}
