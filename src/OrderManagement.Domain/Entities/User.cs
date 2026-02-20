namespace OrderManagement.Domain.Entities;

public class User
{
    public int UserId { get; private set; }
    public string Username { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Role { get; private set; } = "User";
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; }

    private User() { }

    public User(string username, string passwordHash, string fullName, string email, string role)
    {
        Username = username;
        PasswordHash = passwordHash;
        FullName = fullName;
        Email = email;
        Role = role;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string fullName, string email, string role, bool isActive)
    {
        FullName = fullName;
        Email = email;
        Role = role;
        IsActive = isActive;
    }

    public void ChangePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }
}
