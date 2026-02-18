using OrderManagement.Application.DTOs.Response;

namespace OrderManagement.Application.Interfaces;

public interface IOrderQueryService
{
    Task<IEnumerable<OrderResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<OrderResponse>> GetByUserAsync(string username, CancellationToken cancellationToken = default);
    Task<IEnumerable<OrderResponse>> GetPendingApprovalAsync(CancellationToken cancellationToken = default);
    Task<OrderDetailResponse?> GetByIdAsync(int orderId, CancellationToken cancellationToken = default);
}
