using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Application.Commands;

public class CreateOrderCommandHandler
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderProcessingQueue _processingQueue;

    public CreateOrderCommandHandler(IUnitOfWork unitOfWork, IOrderProcessingQueue processingQueue)
    {
        _unitOfWork = unitOfWork;
        _processingQueue = processingQueue;
    }

    public async Task<int> HandleAsync(CreateOrderRequest request, string username = "admin", CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente com Id {request.CustomerId} não encontrado.");

        var paymentCondition = await _unitOfWork.PaymentConditions.GetByIdAsync(request.PaymentConditionId, cancellationToken)
            ?? throw new KeyNotFoundException($"Condição de pagamento com Id {request.PaymentConditionId} não encontrada.");

        var items = request.Items.Select(i => new OrderItem(i.ProductName, i.Quantity, i.UnitPrice));
        var order = new Order(request.CustomerId, request.PaymentConditionId, items, username);

        await _unitOfWork.Orders.AddAsync(order, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        // Publica mensagem na fila para TODOS os pedidos (independente do valor).
        // O Worker consome assincronamente e cria o DeliveryTerm com prazo fixo de 10 dias.
        _processingQueue.Enqueue(new OrderProcessingMessage(order.OrderId));

        return order.OrderId;
    }
}
