using OrderManagement.Application.DTOs.Request;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class CreateCustomerCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateCustomerCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> HandleAsync(CreateCustomerRequest request, CancellationToken cancellationToken = default)
    {
        var customer = new Customer(request.Name, request.Email);
        await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
        return customer.CustomerId;
    }
}
