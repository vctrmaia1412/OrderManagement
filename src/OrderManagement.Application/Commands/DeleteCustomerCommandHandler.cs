using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class DeleteCustomerCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCustomerCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task HandleAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente com Id {customerId} não encontrado.");

        _unitOfWork.Customers.Delete(customer);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}
