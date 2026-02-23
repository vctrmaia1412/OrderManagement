using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;
using Xunit;

namespace OrderManagement.Tests.Domain;

public class OrderTests
{
    #region Criação do pedido

    [Fact]
    public void Criar_pedido_com_total_menor_ou_igual_a_5000_deve_ter_status_Pago()
    {
        var items = new List<OrderItem>
        {
            new OrderItem("Produto A", 2, 1000m),
            new OrderItem("Produto B", 1, 2000m)
        };
        var order = new Order(customerId: 1, paymentConditionId: 1, items);

        Assert.Equal(4000m, order.TotalAmount);
        Assert.False(order.RequiresManualApproval);
        Assert.Equal(OrderStatus.Pago, order.Status);
    }

    [Fact]
    public void Criar_pedido_com_total_igual_a_5000_deve_ter_status_Pago()
    {
        var items = new List<OrderItem>
        {
            new OrderItem("Produto Único", 1, 5000m)
        };
        var order = new Order(customerId: 1, paymentConditionId: 1, items);

        Assert.Equal(5000m, order.TotalAmount);
        Assert.False(order.RequiresManualApproval);
        Assert.Equal(OrderStatus.Pago, order.Status);
    }

    [Fact]
    public void Criar_pedido_com_total_maior_que_5000_deve_ter_status_Criado_e_requerer_aprovacao_manual()
    {
        var items = new List<OrderItem>
        {
            new OrderItem("Produto A", 2, 2000m),
            new OrderItem("Produto B", 1, 2000m)
        };
        var order = new Order(customerId: 1, paymentConditionId: 1, items);

        Assert.Equal(6000m, order.TotalAmount);
        Assert.True(order.RequiresManualApproval);
        Assert.Equal(OrderStatus.Criado, order.Status);
    }

    [Fact]
    public void TotalAmount_deve_ser_calculado_corretamente_a_partir_dos_itens()
    {
        var items = new List<OrderItem>
        {
            new OrderItem("Item 1", 3, 100.50m),
            new OrderItem("Item 2", 2, 250.25m),
            new OrderItem("Item 3", 1, 999.25m)
        };
        var order = new Order(customerId: 1, paymentConditionId: 1, items);

        var totalEsperado = (3 * 100.50m) + (2 * 250.25m) + (1 * 999.25m);
        Assert.Equal(totalEsperado, order.TotalAmount);
        Assert.Equal(3, order.Items.Count);
    }

    #endregion

    #region Aprovação

    [Fact]
    public void Aprovar_pedido_com_status_Criado_e_aprovacao_manual_deve_mudar_para_Pago()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 10, 1000m) };
        var order = new Order(1, 1, items);

        Assert.Equal(OrderStatus.Criado, order.Status);
        Assert.True(order.RequiresManualApproval);

        order.Approve();

        Assert.Equal(OrderStatus.Pago, order.Status);
    }

    [Fact]
    public void Aprovar_pedido_que_ja_esta_Pago_deve_lancar_excecao()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 1, 100m) };
        var order = new Order(1, 1, items);

        Assert.Equal(OrderStatus.Pago, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.Approve());
        Assert.Contains("Criado", ex.Message);
    }

    [Fact]
    public void Aprovar_pedido_sem_flag_de_aprovacao_manual_deve_lancar_excecao()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 1, 100m) };
        var order = new Order(1, 1, items);

        Assert.False(order.RequiresManualApproval);

        Assert.Throws<InvalidOperationException>(() => order.Approve());
    }

    #endregion

    #region Cancelamento

    [Fact]
    public void Cancelar_pedido_com_status_Criado_deve_definir_status_cancelado()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 10, 1000m) };
        var order = new Order(1, 1, items);

        Assert.Equal(OrderStatus.Criado, order.Status);

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelado, order.Status);
    }

    [Fact]
    public void Cancelar_pedido_pago_deve_lancar_excecao()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 1, 100m) };
        var order = new Order(1, 1, items);

        Assert.Equal(OrderStatus.Pago, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.Cancel());
        Assert.Contains("não podem ser cancelados", ex.Message);
    }

    [Fact]
    public void Cancelar_pedido_pago_via_aprovacao_deve_lancar_excecao()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 10, 1000m) };
        var order = new Order(1, 1, items);
        order.Approve();

        Assert.Equal(OrderStatus.Pago, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.Cancel());
        Assert.Contains("não podem ser cancelados", ex.Message);
    }

    [Fact]
    public void Cancelar_pedido_ja_cancelado_deve_lancar_excecao()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 10, 1000m) };
        var order = new Order(1, 1, items);
        order.Cancel();

        Assert.Equal(OrderStatus.Cancelado, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.Cancel());
        Assert.Contains("já está cancelado", ex.Message);
    }

    #endregion

    #region Prazo de entrega

    [Fact]
    public void Definir_prazo_de_entrega_deve_criar_DeliveryTerm_a_partir_da_OrderDate()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 1, 100m) };
        var order = new Order(1, 1, items);

        order.SetDeliveryTerm(10);

        Assert.NotNull(order.DeliveryTerm);
        Assert.Equal(10, order.DeliveryTerm.DeliveryDays);
        Assert.Equal(order.OrderDate.AddDays(10).Date, order.DeliveryTerm.EstimatedDeliveryDate.Date);
    }

    [Fact]
    public void Definir_prazo_de_entrega_duas_vezes_deve_lancar_excecao()
    {
        var items = new List<OrderItem> { new OrderItem("Produto", 1, 100m) };
        var order = new Order(1, 1, items);
        order.SetDeliveryTerm(5);

        var ex = Assert.Throws<InvalidOperationException>(() => order.SetDeliveryTerm(10));

        Assert.Contains("já definido", ex.Message);
        Assert.Equal(5, order.DeliveryTerm!.DeliveryDays);
    }

    #endregion

    #region OrderItem

    [Fact]
    public void OrderItem_deve_calcular_TotalPrice_corretamente()
    {
        var item = new OrderItem("Produto Teste", 4, 25.50m);

        Assert.Equal(102m, item.TotalPrice);
        Assert.Equal("Produto Teste", item.ProductName);
        Assert.Equal(4, item.Quantity);
        Assert.Equal(25.50m, item.UnitPrice);
    }

    [Fact]
    public void OrderItem_com_quantidade_zero_deve_ter_TotalPrice_zero()
    {
        var item = new OrderItem("Produto", 0, 100m);

        Assert.Equal(0m, item.TotalPrice);
    }

    #endregion
}
