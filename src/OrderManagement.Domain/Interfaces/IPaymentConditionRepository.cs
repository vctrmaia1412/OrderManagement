using OrderManagement.Domain.Entities;

namespace OrderManagement.Domain.Interfaces;

public interface IPaymentConditionRepository
{
    Task<PaymentCondition?> GetByIdAsync(int paymentConditionId, CancellationToken cancellationToken = default);
    Task AddAsync(PaymentCondition paymentCondition, CancellationToken cancellationToken = default);
    void Update(PaymentCondition paymentCondition);
}
