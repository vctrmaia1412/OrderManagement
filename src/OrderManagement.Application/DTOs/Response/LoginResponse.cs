namespace OrderManagement.Application.DTOs.Response;

public record LoginResponse(string Token, string Username, DateTime Expiration);
