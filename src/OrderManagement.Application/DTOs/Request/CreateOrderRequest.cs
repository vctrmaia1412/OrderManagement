namespace OrderManagement.Application.DTOs.Request;

public record CreateOrderRequest(
    int CustomerId,
    int PaymentConditionId,
    List<CreateOrderItemRequest> Items);

public record CreateOrderItemRequest(
    string ProductName,
    int Quantity,
    decimal UnitPrice);
