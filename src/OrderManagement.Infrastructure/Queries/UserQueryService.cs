using System.Data;
using Dapper;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Infrastructure.Queries;

public class UserQueryService : IUserQueryService
{
    private readonly IDbConnection _dbConnection;

    public UserQueryService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<UserResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT UserId, Username, FullName, Email, Role, IsActive, CreatedAt
            FROM Users
            ORDER BY UserId";

        return await _dbConnection.QueryAsync<UserResponse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    public async Task<UserResponse?> GetByIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT UserId, Username, FullName, Email, Role, IsActive, CreatedAt
            FROM Users
            WHERE UserId = @UserId";

        return await _dbConnection.QueryFirstOrDefaultAsync<UserResponse>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken));
    }
}
