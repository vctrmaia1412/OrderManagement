using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.DTOs.Response;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    // Usuarios fixos para simplificação do teste (em produção, viriam de banco com hash de senha)
    private static readonly Dictionary<string, (string Password, string Role, string FullName)> Users = new()
    {
        ["admin"] = ("admin123", "Admin", "Administrador"),
        ["joao"] = ("joao123", "User", "João Silva"),
        ["maria"] = ("maria123", "User", "Maria Santos"),
    };

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { Message = "Usuário e senha são obrigatórios." });

        var username = request.Username.ToLower();

        if (!Users.TryGetValue(username, out var userData) || userData.Password != request.Password)
            return Unauthorized(new { Message = "Usuário ou senha inválidos." });

        var token = GenerateToken(username, userData.Role);
        var expiration = DateTime.UtcNow.AddMinutes(
            double.Parse(_configuration["Jwt:ExpirationInMinutes"]!));

        return Ok(new LoginResponse(token, username, userData.Role, userData.FullName, expiration));
    }

    private string GenerateToken(string username, string role)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                double.Parse(_configuration["Jwt:ExpirationInMinutes"]!)),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
