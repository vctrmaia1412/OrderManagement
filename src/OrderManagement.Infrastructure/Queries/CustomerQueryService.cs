using System.Data;
using Dapper;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Infrastructure.Queries;

public class CustomerQueryService : ICustomerQueryService
{
    private readonly IDbConnection _dbConnection;

    public CustomerQueryService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<CustomerResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT CustomerId, Name, Email, CreatedAt
            FROM Customers
            ORDER BY Name";

        return await _dbConnection.QueryAsync<CustomerResponse>(sql);
    }

    public async Task<CustomerResponse?> GetByIdAsync(int customerId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT CustomerId, Name, Email, CreatedAt
            FROM Customers
            WHERE CustomerId = @CustomerId";

        return await _dbConnection.QueryFirstOrDefaultAsync<CustomerResponse>(sql, new { CustomerId = customerId });
    }
}
