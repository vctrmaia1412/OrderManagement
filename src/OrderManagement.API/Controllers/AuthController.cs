using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Infrastructure;
using OrderManagement.Infrastructure.Data;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public AuthController(IConfiguration configuration, AppDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { Message = "Usuário e senha são obrigatórios." });

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username.ToLower());

        if (user is null || !user.IsActive || !HashHelper.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { Message = "Usuário ou senha inválidos." });

        var token = GenerateToken(user.Username, user.Role);
        var expiration = DateTime.UtcNow.AddMinutes(
            double.Parse(_configuration["Jwt:ExpirationInMinutes"]!));

        return Ok(new LoginResponse(token, user.Username, user.Role, user.FullName, expiration));
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
