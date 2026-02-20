namespace OrderManagement.Application.DTOs.Response;

public record UserResponse(int UserId, string Username, string FullName, string Email, string Role, bool IsActive, DateTime CreatedAt);
