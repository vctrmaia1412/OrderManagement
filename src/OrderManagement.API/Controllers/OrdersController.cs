using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Commands;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderQueryService _queryService;
    private readonly CreateOrderCommandHandler _createHandler;
    private readonly ApproveOrderCommandHandler _approveHandler;
    private readonly CancelOrderCommandHandler _cancelHandler;

    public OrdersController(
        IOrderQueryService queryService,
        CreateOrderCommandHandler createHandler,
        ApproveOrderCommandHandler approveHandler,
        CancelOrderCommandHandler cancelHandler)
    {
        _queryService = queryService;
        _createHandler = createHandler;
        _approveHandler = approveHandler;
        _cancelHandler = cancelHandler;
    }

    // Admin vê todos os pedidos; usuário comum vê apenas os seus
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;

        if (role == "Admin")
        {
            var orders = await _queryService.GetAllAsync(cancellationToken);
            return Ok(orders);
        }

        var userOrders = await _queryService.GetByUserAsync(username!, cancellationToken);
        return Ok(userOrders);
    }

    // Fila de aprovação: retorna apenas pedidos pendentes de aprovação manual (somente Admin)
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingApproval(CancellationToken cancellationToken)
    {
        var orders = await _queryService.GetPendingApprovalAsync(cancellationToken);
        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var order = await _queryService.GetByIdAsync(id, cancellationToken);
        if (order is null)
            return NotFound(new { Message = $"Pedido com Id {id} não encontrado." });

        return Ok(order);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "admin";
            var orderId = await _createHandler.HandleAsync(request, username, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = orderId }, new { OrderId = orderId });
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }

    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id, CancellationToken cancellationToken)
    {
        try
        {
            await _approveHandler.HandleAsync(id, cancellationToken);
            return Ok(new { Message = $"Pedido {id} aprovado com sucesso. Status alterado para Pago." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        try
        {
            await _cancelHandler.HandleAsync(id, cancellationToken);
            return Ok(new { Message = $"Pedido {id} cancelado." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }
}
