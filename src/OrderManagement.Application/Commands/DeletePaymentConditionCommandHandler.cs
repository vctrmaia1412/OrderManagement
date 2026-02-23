using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class DeletePaymentConditionCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public DeletePaymentConditionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task HandleAsync(int paymentConditionId, CancellationToken cancellationToken = default)
    {
        var paymentCondition = await _unitOfWork.PaymentConditions.GetByIdAsync(paymentConditionId, cancellationToken)
            ?? throw new KeyNotFoundException($"Condição de pagamento com Id {paymentConditionId} não encontrada.");

        _unitOfWork.PaymentConditions.Delete(paymentCondition);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}
