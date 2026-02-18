namespace OrderManagement.Application.DTOs.Response;

public record CustomerResponse(
    int CustomerId,
    string Name,
    string Email,
    DateTime CreatedAt);
