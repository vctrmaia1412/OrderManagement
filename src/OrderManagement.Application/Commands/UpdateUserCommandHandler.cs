using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Domain.Constants;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class UpdateUserCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserResponse> HandleAsync(int userId, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (!Roles.IsValid(request.Role))
            throw new ArgumentException($"Role inválida. Use: {string.Join(", ", Roles.All)}");

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Usuário não encontrado.");

        user.Update(request.FullName, request.Email, request.Role, request.IsActive);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new UserResponse(user.UserId, user.Username, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt);
    }
}
