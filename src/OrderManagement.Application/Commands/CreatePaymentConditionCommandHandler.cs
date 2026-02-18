using OrderManagement.Application.DTOs.Request;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class CreatePaymentConditionCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePaymentConditionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> HandleAsync(CreatePaymentConditionRequest request, CancellationToken cancellationToken = default)
    {
        var paymentCondition = new PaymentCondition(request.Description, request.NumberOfInstallments);
        await _unitOfWork.PaymentConditions.AddAsync(paymentCondition, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
        return paymentCondition.PaymentConditionId;
    }
}
