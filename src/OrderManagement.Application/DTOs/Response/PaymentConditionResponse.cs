namespace OrderManagement.Application.DTOs.Response;

public record PaymentConditionResponse(
    int PaymentConditionId,
    string Description,
    int NumberOfInstallments,
    DateTime CreatedAt);
