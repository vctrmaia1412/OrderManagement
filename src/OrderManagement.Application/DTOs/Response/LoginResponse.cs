namespace OrderManagement.Application.DTOs.Response;

public record LoginResponse(string Token, string Username, string Role, string FullName, DateTime Expiration);
