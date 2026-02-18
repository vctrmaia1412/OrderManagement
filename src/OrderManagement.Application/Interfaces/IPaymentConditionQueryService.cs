using OrderManagement.Application.DTOs.Response;

namespace OrderManagement.Application.Interfaces;

public interface IPaymentConditionQueryService
{
    Task<IEnumerable<PaymentConditionResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PaymentConditionResponse?> GetByIdAsync(int paymentConditionId, CancellationToken cancellationToken = default);
}
