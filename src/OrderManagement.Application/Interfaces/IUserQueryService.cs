using OrderManagement.Application.DTOs.Response;

namespace OrderManagement.Application.Interfaces;

public interface IUserQueryService
{
    Task<IEnumerable<UserResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<UserResponse?> GetByIdAsync(int userId, CancellationToken cancellationToken = default);
}
