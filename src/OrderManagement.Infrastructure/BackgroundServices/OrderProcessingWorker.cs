using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Interfaces;

namespace OrderManagement.Infrastructure.BackgroundServices;

/// <summary>
/// Background Worker (IHostedService) que consome mensagens da fila in-memory.
/// Responsabilidade única: criar o DeliveryTerm com prazo fixo de 10 dias.
/// Não altera o status do pedido — apenas calcula e persiste o prazo de entrega.
/// Em produção, esta fila seria substituída por RabbitMQ/Azure Service Bus.
/// </summary>
public class OrderProcessingWorker : BackgroundService
{
    private const int DeliveryDays = 10;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOrderProcessingQueue _queue;
    private readonly ILogger<OrderProcessingWorker> _logger;

    public OrderProcessingWorker(
        IServiceScopeFactory scopeFactory,
        IOrderProcessingQueue queue,
        ILogger<OrderProcessingWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _queue = queue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[Worker] Order Processing Worker iniciado. Aguardando mensagens na fila...");

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_queue.TryDequeue(out var message) && message is not null)
            {
                _logger.LogInformation(
                    "[Worker] Mensagem consumida da fila: OrderId={OrderId}.",
                    message.OrderId);

                try
                {
                    await ProcessOrderAsync(message, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Worker] Erro ao processar pedido {OrderId}.", message.OrderId);
                }
            }
            else
            {
                await Task.Delay(1000, stoppingToken);
            }
        }

        _logger.LogInformation("[Worker] Order Processing Worker encerrado.");
    }

    private async Task ProcessOrderAsync(OrderProcessingMessage message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var order = await unitOfWork.Orders.GetByIdAsync(message.OrderId, cancellationToken);
        if (order is null)
        {
            _logger.LogWarning("[Worker] Pedido {OrderId} não encontrado para processamento.", message.OrderId);
            return;
        }

        _logger.LogInformation(
            "[Worker] Pedido {OrderId} - Calculando prazo de entrega: {DeliveryDays} dias a partir de {OrderDate:dd/MM/yyyy}...",
            message.OrderId, DeliveryDays, order.OrderDate);

        // Simula latência de processamento assíncrono (em produção seria I/O real)
        await Task.Delay(2000, cancellationToken);

        order.SetDeliveryTerm(DeliveryDays);
        unitOfWork.Orders.Update(order);
        await unitOfWork.CommitAsync(cancellationToken);

        _logger.LogInformation(
            "[Worker] Pedido {OrderId} - DeliveryTerm criado. Previsão de entrega: {EstimatedDate:dd/MM/yyyy}. Processamento concluído via fila.",
            message.OrderId, order.DeliveryTerm!.EstimatedDeliveryDate);
    }
}
