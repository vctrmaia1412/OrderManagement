namespace OrderManagement.Domain.Entities;

public class Customer
{
    public int CustomerId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    public ICollection<Order> Orders { get; private set; } = new List<Order>();

    private Customer() { }

    public Customer(string name, string email)
    {
        Name = name;
        Email = email;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string name, string email)
    {
        Name = name;
        Email = email;
    }
}
