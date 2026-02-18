using Moq;
using OrderManagement.Application.Commands;
using OrderManagement.Application.DTOs.Request;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;
using Xunit;

namespace OrderManagement.Tests.Application;

public class CreateOrderCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IOrderRepository> _orderRepositoryMock;
    private readonly Mock<ICustomerRepository> _customerRepositoryMock;
    private readonly Mock<IPaymentConditionRepository> _paymentConditionRepositoryMock;
    private readonly Mock<IOrderProcessingQueue> _processingQueueMock;
    private readonly CreateOrderCommandHandler _handler;

    public CreateOrderCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _customerRepositoryMock = new Mock<ICustomerRepository>();
        _paymentConditionRepositoryMock = new Mock<IPaymentConditionRepository>();
        _processingQueueMock = new Mock<IOrderProcessingQueue>();

        _unitOfWorkMock.Setup(u => u.Orders).Returns(_orderRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Customers).Returns(_customerRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.PaymentConditions).Returns(_paymentConditionRepositoryMock.Object);

        _handler = new CreateOrderCommandHandler(_unitOfWorkMock.Object, _processingQueueMock.Object);
    }

    private void SetupValidDependencies(int customerId = 1, int paymentConditionId = 1)
    {
        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Customer("Cliente Teste", "cliente@teste.com"));
        _paymentConditionRepositoryMock
            .Setup(x => x.GetByIdAsync(paymentConditionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentCondition("A vista", 1));
        _orderRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock
            .Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
    }

    [Fact]
    public async Task Criar_pedido_deve_sempre_enfileirar_independente_do_valor()
    {
        SetupValidDependencies();
        var request = new CreateOrderRequest(1, 1,
            new List<CreateOrderItemRequest> { new("Produto", 1, 100m) });

        await _handler.HandleAsync(request);

        _processingQueueMock.Verify(
            x => x.Enqueue(It.IsAny<OrderProcessingMessage>()),
            Times.Once);
    }

    [Fact]
    public async Task Criar_pedido_com_total_maior_que_5000_deve_enfileirar_tambem()
    {
        SetupValidDependencies();
        var request = new CreateOrderRequest(1, 1,
            new List<CreateOrderItemRequest> { new("Produto Caro", 1, 6000m) });

        await _handler.HandleAsync(request);

        _processingQueueMock.Verify(
            x => x.Enqueue(It.IsAny<OrderProcessingMessage>()),
            Times.Once);
    }

    [Fact]
    public async Task Criar_pedido_com_cliente_invalido_deve_lancar_KeyNotFoundException()
    {
        var customerId = 999;
        var request = new CreateOrderRequest(customerId, 1,
            new List<CreateOrderItemRequest> { new("Produto", 1, 100m) });

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Customer?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _handler.HandleAsync(request));
        Assert.Contains("Cliente", ex.Message);
    }

    [Fact]
    public async Task Criar_pedido_com_condicao_de_pagamento_invalida_deve_lancar_KeyNotFoundException()
    {
        var paymentConditionId = 999;
        var request = new CreateOrderRequest(1, paymentConditionId,
            new List<CreateOrderItemRequest> { new("Produto", 1, 100m) });

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Customer("Cliente", "email@teste.com"));
        _paymentConditionRepositoryMock
            .Setup(x => x.GetByIdAsync(paymentConditionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentCondition?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _handler.HandleAsync(request));
        Assert.Contains("pagamento", ex.Message);
    }

    [Fact]
    public async Task Criar_pedido_deve_chamar_CommitAsync()
    {
        SetupValidDependencies();
        var request = new CreateOrderRequest(1, 1,
            new List<CreateOrderItemRequest> { new("Produto", 1, 100m) });

        await _handler.HandleAsync(request);

        _unitOfWorkMock.Verify(
            x => x.CommitAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Criar_pedido_deve_adicionar_pedido_com_dados_corretos()
    {
        SetupValidDependencies(customerId: 1, paymentConditionId: 2);
        Order? capturedOrder = null;
        _orderRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Callback<Order, CancellationToken>((o, _) => capturedOrder = o)
            .Returns(Task.CompletedTask);

        var request = new CreateOrderRequest(1, 2,
            new List<CreateOrderItemRequest>
            {
                new("Produto A", 2, 50m),
                new("Produto B", 1, 100m)
            });

        await _handler.HandleAsync(request);

        Assert.NotNull(capturedOrder);
        Assert.Equal(1, capturedOrder.CustomerId);
        Assert.Equal(2, capturedOrder.PaymentConditionId);
        Assert.Equal(200m, capturedOrder.TotalAmount);
        Assert.Equal(2, capturedOrder.Items.Count);
    }
}
