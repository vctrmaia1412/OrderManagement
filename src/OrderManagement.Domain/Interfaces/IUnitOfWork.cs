namespace OrderManagement.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IOrderRepository Orders { get; }
    ICustomerRepository Customers { get; }
    IPaymentConditionRepository PaymentConditions { get; }
    IUserRepository Users { get; }
    Task<int> CommitAsync(CancellationToken cancellationToken = default);
}
