using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Commands;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Constants;

namespace OrderManagement.API.Controllers;

[Authorize(Roles = Roles.Admin)]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserQueryService _queryService;
    private readonly CreateUserCommandHandler _createHandler;
    private readonly UpdateUserCommandHandler _updateHandler;
    private readonly ChangePasswordCommandHandler _changePasswordHandler;

    public UsersController(
        IUserQueryService queryService,
        CreateUserCommandHandler createHandler,
        UpdateUserCommandHandler updateHandler,
        ChangePasswordCommandHandler changePasswordHandler)
    {
        _queryService = queryService;
        _createHandler = createHandler;
        _updateHandler = updateHandler;
        _changePasswordHandler = changePasswordHandler;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _queryService.GetAllAsync(cancellationToken);
        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var user = await _queryService.GetByIdAsync(id, cancellationToken);
        if (user is null) return NotFound(new { Message = "Usuário não encontrado." });
        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _createHandler.HandleAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = user.UserId }, user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _updateHandler.HandleAsync(id, request, cancellationToken);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await _changePasswordHandler.HandleAsync(id, request, cancellationToken);
            return Ok(new { Message = "Senha alterada com sucesso." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }
}
