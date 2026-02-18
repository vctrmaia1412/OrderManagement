namespace OrderManagement.Application.DTOs.Request;

public record CreatePaymentConditionRequest(string Description, int NumberOfInstallments);
