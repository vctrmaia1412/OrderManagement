using OrderManagement.Domain.Enums;

namespace OrderManagement.Domain.Entities;

public class Order
{
    // Pedidos acima deste valor exigem aprovação manual (status Criado); abaixo, são aprovados automaticamente (status Pago)
    public const decimal ApprovalThreshold = 5000m;

    public int OrderId { get; private set; }
    public int CustomerId { get; private set; }
    public int PaymentConditionId { get; private set; }
    public DateTime OrderDate { get; private set; }
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }
    public bool RequiresManualApproval { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    public Customer Customer { get; private set; } = null!;
    public PaymentCondition PaymentCondition { get; private set; } = null!;
    public ICollection<OrderItem> Items { get; private set; } = new List<OrderItem>();
    public DeliveryTerm? DeliveryTerm { get; private set; }

    private Order() { }

    public Order(int customerId, int paymentConditionId, IEnumerable<OrderItem> items, string createdBy = "admin")
    {
        CustomerId = customerId;
        PaymentConditionId = paymentConditionId;
        CreatedBy = createdBy;
        OrderDate = DateTime.UtcNow;
        CreatedAt = DateTime.UtcNow;

        foreach (var item in items)
            Items.Add(item);

        TotalAmount = Items.Sum(i => i.TotalPrice);
        RequiresManualApproval = TotalAmount > ApprovalThreshold;

        // Regra de negócio: > R$5.000 fica como "Criado" aguardando aprovação; <= R$5.000 já nasce como "Pago"
        Status = RequiresManualApproval ? OrderStatus.Criado : OrderStatus.Pago;
    }

    public void SetDeliveryTerm(int deliveryDays)
    {
        if (DeliveryTerm is not null)
            throw new InvalidOperationException("Prazo de entrega já definido para este pedido.");

        DeliveryTerm = new DeliveryTerm(deliveryDays, OrderDate);
    }

    // Aprovação manual: transiciona diretamente de Criado para Pago (sem estados intermediários)
    public void Approve()
    {
        if (Status != OrderStatus.Criado || !RequiresManualApproval)
            throw new InvalidOperationException("Somente pedidos com status Criado e aprovação manual pendente podem ser aprovados.");

        Status = OrderStatus.Pago;
    }

    public void Cancel()
    {
        if (Status == OrderStatus.Pago)
            throw new InvalidOperationException("Pedidos pagos não podem ser cancelados.");

        if (Status == OrderStatus.Cancelado)
            throw new InvalidOperationException("Pedido já está cancelado.");

        Status = OrderStatus.Cancelado;
    }
}
