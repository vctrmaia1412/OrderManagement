using OrderManagement.Application.DTOs.Request;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class UpdatePaymentConditionCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePaymentConditionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task HandleAsync(int paymentConditionId, UpdatePaymentConditionRequest request, CancellationToken cancellationToken = default)
    {
        var paymentCondition = await _unitOfWork.PaymentConditions.GetByIdAsync(paymentConditionId, cancellationToken)
            ?? throw new KeyNotFoundException($"Condição de pagamento com Id {paymentConditionId} não encontrada.");

        paymentCondition.Update(request.Description, request.NumberOfInstallments);
        _unitOfWork.PaymentConditions.Update(paymentCondition);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}
