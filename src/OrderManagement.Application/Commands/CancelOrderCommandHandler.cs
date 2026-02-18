using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class CancelOrderCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;

    public CancelOrderCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task HandleAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException($"Pedido com Id {orderId} não encontrado.");

        order.Cancel();
        _unitOfWork.Orders.Update(order);
        await _unitOfWork.CommitAsync(cancellationToken);
    }
}
