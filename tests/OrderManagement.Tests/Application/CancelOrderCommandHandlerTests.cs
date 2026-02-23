using Moq;
using OrderManagement.Application.Commands;
using OrderManagement.Domain.Constants;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Interfaces;
using Xunit;

namespace OrderManagement.Tests.Application;

public class CancelOrderCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IOrderRepository> _orderRepositoryMock;
    private readonly CancelOrderCommandHandler _handler;

    public CancelOrderCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _unitOfWorkMock.Setup(u => u.Orders).Returns(_orderRepositoryMock.Object);
        _handler = new CancelOrderCommandHandler(_unitOfWorkMock.Object);
    }

    private Order CreateOrderWithStatus(string createdBy, decimal totalAmount)
    {
        var items = new[] { new OrderItem("Produto", 1, totalAmount) };
        return new Order(1, 1, items, createdBy);
    }

    [Fact]
    public async Task Cancelar_pedido_proprio_deve_funcionar_para_usuario_comum()
    {
        var order = CreateOrderWithStatus("joao", 6000m);
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        await _handler.HandleAsync(1, "joao", Roles.User);

        _unitOfWorkMock.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Cancelar_pedido_de_outro_usuario_deve_lancar_excecao_para_usuario_comum()
    {
        var order = CreateOrderWithStatus("maria", 6000m);
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _handler.HandleAsync(1, "joao", Roles.User));
        Assert.Contains("permissão", ex.Message);
    }

    [Fact]
    public async Task Admin_pode_cancelar_pedido_de_qualquer_usuario()
    {
        var order = CreateOrderWithStatus("joao", 6000m);
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        await _handler.HandleAsync(1, "admin", Roles.Admin);

        _unitOfWorkMock.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Manager_pode_cancelar_pedido_de_qualquer_usuario()
    {
        var order = CreateOrderWithStatus("joao", 6000m);
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        await _handler.HandleAsync(1, "gerente", Roles.Manager);

        _unitOfWorkMock.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Cancelar_pedido_inexistente_deve_lancar_KeyNotFoundException()
    {
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _handler.HandleAsync(999, "joao", Roles.User));
        Assert.Contains("999", ex.Message);
    }

    [Fact]
    public async Task Cancelar_pedido_pago_deve_lancar_InvalidOperationException()
    {
        var order = CreateOrderWithStatus("joao", 100m);
        _orderRepositoryMock
            .Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.HandleAsync(1, "joao", Roles.User));
    }
}
