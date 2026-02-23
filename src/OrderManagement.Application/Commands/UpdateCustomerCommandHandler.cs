using OrderManagement.Application.DTOs.Request;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class UpdateCustomerCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCustomerCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task HandleAsync(int customerId, UpdateCustomerRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente com Id {customerId} não encontrado.");

        customer.Update(request.Name, request.Email);
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}
