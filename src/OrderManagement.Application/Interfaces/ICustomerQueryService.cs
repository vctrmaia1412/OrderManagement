using OrderManagement.Application.DTOs.Response;

namespace OrderManagement.Application.Interfaces;

public interface ICustomerQueryService
{
    Task<IEnumerable<CustomerResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CustomerResponse?> GetByIdAsync(int customerId, CancellationToken cancellationToken = default);
}
