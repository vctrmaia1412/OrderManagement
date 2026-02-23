using Moq;
using OrderManagement.Application.Commands;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;
using Xunit;

namespace OrderManagement.Tests.Application;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _tokenServiceMock = new Mock<ITokenService>();

        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoryMock.Object);

        _handler = new LoginCommandHandler(
            _unitOfWorkMock.Object,
            _passwordHasherMock.Object,
            _tokenServiceMock.Object);
    }

    [Fact]
    public async Task Login_valido_deve_retornar_LoginResponse_com_token()
    {
        var user = new User("admin", "hash123", "Administrador", "admin@test.com", "Admin");
        _userRepositoryMock
            .Setup(x => x.GetByUsernameAsync("admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasherMock
            .Setup(x => x.Verify("admin123", "hash123"))
            .Returns(true);
        _tokenServiceMock
            .Setup(x => x.GenerateToken("admin", "Admin"))
            .Returns("jwt-token-123");
        _tokenServiceMock
            .Setup(x => x.GetExpiration())
            .Returns(new DateTime(2026, 12, 31));

        var result = await _handler.HandleAsync(new LoginRequest("admin", "admin123"));

        Assert.Equal("jwt-token-123", result.Token);
        Assert.Equal("admin", result.Username);
        Assert.Equal("Admin", result.Role);
        Assert.Equal("Administrador", result.FullName);
    }

    [Fact]
    public async Task Login_com_username_vazio_deve_lancar_ArgumentException()
    {
        var request = new LoginRequest("", "senha");

        await Assert.ThrowsAsync<ArgumentException>(
            () => _handler.HandleAsync(request));
    }

    [Fact]
    public async Task Login_com_senha_vazia_deve_lancar_ArgumentException()
    {
        var request = new LoginRequest("admin", "");

        await Assert.ThrowsAsync<ArgumentException>(
            () => _handler.HandleAsync(request));
    }

    [Fact]
    public async Task Login_com_usuario_inexistente_deve_lancar_UnauthorizedAccessException()
    {
        _userRepositoryMock
            .Setup(x => x.GetByUsernameAsync("desconhecido", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new LoginRequest("desconhecido", "senha");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _handler.HandleAsync(request));
    }

    [Fact]
    public async Task Login_com_senha_incorreta_deve_lancar_UnauthorizedAccessException()
    {
        var user = new User("admin", "hash123", "Admin", "admin@test.com", "Admin");
        _userRepositoryMock
            .Setup(x => x.GetByUsernameAsync("admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasherMock
            .Setup(x => x.Verify("senha-errada", "hash123"))
            .Returns(false);

        var request = new LoginRequest("admin", "senha-errada");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _handler.HandleAsync(request));
    }

    [Fact]
    public async Task Login_com_usuario_inativo_deve_lancar_UnauthorizedAccessException()
    {
        var user = new User("inativo", "hash", "Inativo", "inativo@test.com", "User");
        user.Update("Inativo", "inativo@test.com", "User", false);

        _userRepositoryMock
            .Setup(x => x.GetByUsernameAsync("inativo", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest("inativo", "senha");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _handler.HandleAsync(request));
    }
}
