namespace OrderManagement.Application.DTOs.Request;

public record UpdateUserRequest(string FullName, string Email, string Role, bool IsActive);
