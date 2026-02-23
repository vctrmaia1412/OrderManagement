using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class LoginCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse> HandleAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Usuário e senha são obrigatórios.");

        var user = await _unitOfWork.Users.GetByUsernameAsync(request.Username.ToLower(), cancellationToken);

        if (user is null || !user.IsActive || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Usuário ou senha inválidos.");

        var token = _tokenService.GenerateToken(user.Username, user.Role);
        var expiration = _tokenService.GetExpiration();

        return new LoginResponse(token, user.Username, user.Role, user.FullName, expiration);
    }
}
