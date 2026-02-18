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

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var orders = await _queryService.GetAllAsync(cancellationToken);
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
            var orderId = await _createHandler.HandleAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = orderId }, new { OrderId = orderId });
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }

    [HttpPut("{id:int}/approve")]
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
