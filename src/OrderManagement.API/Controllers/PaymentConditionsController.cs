using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Commands;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentConditionsController : ControllerBase
{
    private readonly IPaymentConditionQueryService _queryService;
    private readonly CreatePaymentConditionCommandHandler _createHandler;

    public PaymentConditionsController(
        IPaymentConditionQueryService queryService,
        CreatePaymentConditionCommandHandler createHandler)
    {
        _queryService = queryService;
        _createHandler = createHandler;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var conditions = await _queryService.GetAllAsync(cancellationToken);
        return Ok(conditions);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var condition = await _queryService.GetByIdAsync(id, cancellationToken);
        if (condition is null)
            return NotFound(new { Message = $"Condição de pagamento com Id {id} não encontrada." });

        return Ok(condition);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentConditionRequest request, CancellationToken cancellationToken)
    {
        var paymentConditionId = await _createHandler.HandleAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = paymentConditionId }, new { PaymentConditionId = paymentConditionId });
    }
}
