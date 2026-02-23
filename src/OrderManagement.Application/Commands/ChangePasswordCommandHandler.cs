using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class ChangePasswordCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task HandleAsync(int userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            throw new ArgumentException("Senha deve ter no mínimo 6 caracteres.");

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Usuário não encontrado.");

        user.ChangePassword(_passwordHasher.Hash(request.NewPassword));
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}
