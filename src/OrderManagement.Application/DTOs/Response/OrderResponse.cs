namespace OrderManagement.Application.DTOs.Response;

public record OrderResponse(
    int OrderId,
    int CustomerId,
    string CustomerName,
    int PaymentConditionId,
    string PaymentConditionDescription,
    DateTime OrderDate,
    decimal TotalAmount,
    string Status,
    bool RequiresManualApproval,
    DateTime CreatedAt);
