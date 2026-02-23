using OrderManagement.Domain.Interfaces;
using OrderManagement.Infrastructure.Data;

namespace OrderManagement.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IOrderRepository? _orders;
    private ICustomerRepository? _customers;
    private IPaymentConditionRepository? _paymentConditions;
    private IUserRepository? _users;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IOrderRepository Orders => _orders ??= new OrderRepository(_context);
    public ICustomerRepository Customers => _customers ??= new CustomerRepository(_context);
    public IPaymentConditionRepository PaymentConditions => _paymentConditions ??= new PaymentConditionRepository(_context);
    public IUserRepository Users => _users ??= new UserRepository(_context);

    public async Task<int> CommitAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
