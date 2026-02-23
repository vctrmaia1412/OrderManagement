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
    private readonly UpdateCustomerCommandHandler _updateHandler;
    private readonly DeleteCustomerCommandHandler _deleteHandler;

    public CustomersController(
        ICustomerQueryService queryService,
        CreateCustomerCommandHandler createHandler,
        UpdateCustomerCommandHandler updateHandler,
        DeleteCustomerCommandHandler deleteHandler)
    {
        _queryService = queryService;
        _createHandler = createHandler;
        _updateHandler = updateHandler;
        _deleteHandler = deleteHandler;
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

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        await _updateHandler.HandleAsync(id, request, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _deleteHandler.HandleAsync(id, cancellationToken);
        return NoContent();
    }
}
