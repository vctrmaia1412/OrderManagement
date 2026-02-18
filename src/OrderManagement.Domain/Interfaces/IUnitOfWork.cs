namespace OrderManagement.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IOrderRepository Orders { get; }
    ICustomerRepository Customers { get; }
    IPaymentConditionRepository PaymentConditions { get; }
    Task<int> CommitAsync(CancellationToken cancellationToken = default);
}
