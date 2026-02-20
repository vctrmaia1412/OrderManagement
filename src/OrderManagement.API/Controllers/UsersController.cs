using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Domain.Entities;
using OrderManagement.Infrastructure;
using OrderManagement.Infrastructure.Data;

namespace OrderManagement.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private static readonly string[] ValidRoles = { "Admin", "Manager", "User" };

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .OrderBy(u => u.UserId)
            .Select(u => new UserResponse(u.UserId, u.Username, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user is null) return NotFound(new { Message = "Usuário não encontrado." });

        return Ok(new UserResponse(user.UserId, user.Username, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        if (!ValidRoles.Contains(request.Role))
            return BadRequest(new { Message = $"Role inválida. Use: {string.Join(", ", ValidRoles)}" });

        if (await _context.Users.AnyAsync(u => u.Username == request.Username.ToLower(), cancellationToken))
            return BadRequest(new { Message = "Username já existe." });

        var user = new User(
            request.Username.ToLower(),
            HashHelper.Hash(request.Password),
            request.FullName,
            request.Email,
            request.Role);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = user.UserId },
            new UserResponse(user.UserId, user.Username, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (!ValidRoles.Contains(request.Role))
            return BadRequest(new { Message = $"Role inválida. Use: {string.Join(", ", ValidRoles)}" });

        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user is null) return NotFound(new { Message = "Usuário não encontrado." });

        user.Update(request.FullName, request.Email, request.Role, request.IsActive);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new UserResponse(user.UserId, user.Username, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user is null) return NotFound(new { Message = "Usuário não encontrado." });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { Message = "Senha deve ter no mínimo 6 caracteres." });

        user.ChangePassword(HashHelper.Hash(request.NewPassword));
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { Message = "Senha alterada com sucesso." });
    }
}
