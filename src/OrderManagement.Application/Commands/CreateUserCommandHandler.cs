using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Constants;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class CreateUserCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserResponse> HandleAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (!Roles.IsValid(request.Role))
            throw new ArgumentException($"Role inválida. Use: {string.Join(", ", Roles.All)}");

        if (await _unitOfWork.Users.ExistsByUsernameAsync(request.Username.ToLower(), cancellationToken))
            throw new ArgumentException("Username já existe.");

        var user = new User(
            request.Username.ToLower(),
            _passwordHasher.Hash(request.Password),
            request.FullName,
            request.Email,
            request.Role);

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new UserResponse(user.UserId, user.Username, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt);
    }
}
