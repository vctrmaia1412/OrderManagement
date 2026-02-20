namespace OrderManagement.Application.DTOs.Request;

public record CreateUserRequest(string Username, string Password, string FullName, string Email, string Role);
