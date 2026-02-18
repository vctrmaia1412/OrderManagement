using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;
using OrderManagement.Infrastructure.Data;

namespace OrderManagement.Infrastructure.Repositories;

public class PaymentConditionRepository : IPaymentConditionRepository
{
    private readonly AppDbContext _context;

    public PaymentConditionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentCondition?> GetByIdAsync(int paymentConditionId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentConditions.FindAsync(new object[] { paymentConditionId }, cancellationToken);
    }

    public async Task AddAsync(PaymentCondition paymentCondition, CancellationToken cancellationToken = default)
    {
        await _context.PaymentConditions.AddAsync(paymentCondition, cancellationToken);
    }

    public void Update(PaymentCondition paymentCondition)
    {
        _context.PaymentConditions.Update(paymentCondition);
    }
}
