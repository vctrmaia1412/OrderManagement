using Moq;
using OrderManagement.Application.Commands;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;
using OrderManagement.Domain.Interfaces;
using Xunit;

namespace OrderManagement.Tests.Application;

public class ApproveOrderCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IOrderRepository> _orderRepositoryMock;
    private readonly ApproveOrderCommandHandler _handler;

    public ApproveOrderCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _orderRepositoryMock = new Mock<IOrderRepository>();

        _unitOfWorkMock.Setup(u => u.Orders).Returns(_orderRepositoryMock.Object);

        _handler = new ApproveOrderCommandHandler(_unitOfWorkMock.Object);
    }

    [Fact]
    public async Task Aprovar_pedido_valido_deve_mudar_status_para_Pago()
    {
        var orderId = 42;
        var items = new List<OrderItem> { new OrderItem("Produto Caro", 1, 6000m) };
        var order = new Order(1, 1, items);

        Assert.Equal(OrderStatus.Criado, order.Status);

        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _unitOfWorkMock
            .Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        await _handler.HandleAsync(orderId);

        Assert.Equal(OrderStatus.Pago, order.Status);
    }

    [Fact]
    public async Task Aprovar_pedido_inexistente_deve_lancar_KeyNotFoundException()
    {
        var orderId = 999;
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _handler.HandleAsync(orderId));
        Assert.Contains("Pedido", ex.Message);
    }

    [Fact]
    public async Task Aprovar_pedido_deve_chamar_Update_e_CommitAsync()
    {
        var orderId = 1;
        var items = new List<OrderItem> { new OrderItem("Produto", 1, 6000m) };
        var order = new Order(1, 1, items);

        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _unitOfWorkMock
            .Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        await _handler.HandleAsync(orderId);

        _orderRepositoryMock.Verify(x => x.Update(order), Times.Once);
        _unitOfWorkMock.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
