using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;
using OrderManagement.Infrastructure.BackgroundServices;
using Xunit;

namespace OrderManagement.Tests.Infrastructure;

public class OrderProcessingWorkerTests
{
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock;
    private readonly Mock<IServiceScope> _scopeMock;
    private readonly Mock<IServiceProvider> _serviceProviderMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IOrderRepository> _orderRepositoryMock;
    private readonly Mock<ILogger<OrderProcessingWorker>> _loggerMock;
    private readonly InMemoryOrderProcessingQueue _queue;

    public OrderProcessingWorkerTests()
    {
        _scopeFactoryMock = new Mock<IServiceScopeFactory>();
        _scopeMock = new Mock<IServiceScope>();
        _serviceProviderMock = new Mock<IServiceProvider>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _loggerMock = new Mock<ILogger<OrderProcessingWorker>>();
        _queue = new InMemoryOrderProcessingQueue();

        _unitOfWorkMock.Setup(u => u.Orders).Returns(_orderRepositoryMock.Object);

        _serviceProviderMock
            .Setup(sp => sp.GetService(typeof(IUnitOfWork)))
            .Returns(_unitOfWorkMock.Object);

        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
        _scopeFactoryMock.Setup(f => f.CreateScope()).Returns(_scopeMock.Object);
    }

    private OrderProcessingWorker CreateWorker()
    {
        return new OrderProcessingWorker(_scopeFactoryMock.Object, _queue, _loggerMock.Object);
    }

    [Fact]
    public async Task Worker_deve_criar_DeliveryTerm_com_10_dias_a_partir_da_OrderDate()
    {
        var items = new List<OrderItem> { new("Produto", 1, 100m) };
        var order = new Order(1, 1, items, "testuser");

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _unitOfWorkMock
            .Setup(u => u.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _queue.Enqueue(new OrderProcessingMessage(1));

        var worker = CreateWorker();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));

        await RunWorkerOnceAsync(worker, cts.Token);

        Assert.NotNull(order.DeliveryTerm);
        Assert.Equal(10, order.DeliveryTerm.DeliveryDays);
        Assert.Equal(
            order.OrderDate.AddDays(10).Date,
            order.DeliveryTerm.EstimatedDeliveryDate.Date);

        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Worker_com_pedido_inexistente_nao_deve_lancar_excecao()
    {
        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        _queue.Enqueue(new OrderProcessingMessage(999));

        var worker = CreateWorker();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));

        await RunWorkerOnceAsync(worker, cts.Token);

        _unitOfWorkMock.Verify(
            u => u.CommitAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Worker_deve_persistir_entrega_via_UnitOfWork()
    {
        var items = new List<OrderItem> { new("Produto", 1, 6000m) };
        var order = new Order(1, 1, items, "admin");

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _unitOfWorkMock
            .Setup(u => u.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _queue.Enqueue(new OrderProcessingMessage(1));

        var worker = CreateWorker();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));

        await RunWorkerOnceAsync(worker, cts.Token);

        _orderRepositoryMock.Verify(r => r.Update(order), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Worker_com_fila_vazia_nao_deve_processar_nada()
    {
        var worker = CreateWorker();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));

        try
        {
            await worker.StartAsync(cts.Token);
            await Task.Delay(2000, cts.Token);
        }
        catch (OperationCanceledException) { }
        finally
        {
            await worker.StopAsync(CancellationToken.None);
        }

        _orderRepositoryMock.Verify(
            r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// Executa o worker processando uma única mensagem da fila, evitando o loop infinito do BackgroundService.
    /// Usa StartAsync + StopAsync com timeout para garantir que pelo menos uma iteração ocorra.
    /// </summary>
    private async Task RunWorkerOnceAsync(OrderProcessingWorker worker, CancellationToken ct)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

        await worker.StartAsync(cts.Token);
        await Task.Delay(4000, ct);
        cts.Cancel();
        await worker.StopAsync(CancellationToken.None);
    }
}
