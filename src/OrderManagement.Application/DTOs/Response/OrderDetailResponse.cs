namespace OrderManagement.Application.DTOs.Response;

public record OrderDetailResponse(
    int OrderId,
    int CustomerId,
    string CustomerName,
    int PaymentConditionId,
    string PaymentConditionDescription,
    DateTime OrderDate,
    decimal TotalAmount,
    string Status,
    bool RequiresManualApproval,
    DateTime CreatedAt)
{
    public List<OrderItemResponse> Items { get; init; } = new();
    public DeliveryTermResponse? DeliveryTerm { get; init; }
}

public record OrderItemResponse(
    int OrderItemId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice);

public record DeliveryTermResponse(
    int DeliveryTermId,
    DateTime EstimatedDeliveryDate,
    int DeliveryDays,
    DateTime CreatedAt);
