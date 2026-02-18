using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Commands;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerQueryService _queryService;
    private readonly CreateCustomerCommandHandler _createHandler;

    public CustomersController(
        ICustomerQueryService queryService,
        CreateCustomerCommandHandler createHandler)
    {
        _queryService = queryService;
        _createHandler = createHandler;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var customers = await _queryService.GetAllAsync(cancellationToken);
        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var customer = await _queryService.GetByIdAsync(id, cancellationToken);
        if (customer is null)
            return NotFound(new { Message = $"Cliente com Id {id} não encontrado." });

        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var customerId = await _createHandler.HandleAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = customerId }, new { CustomerId = customerId });
    }
}
