namespace OrderManagement.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(string username, string role);
    DateTime GetExpiration();
}
