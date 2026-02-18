using System.Data;
using Dapper;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Infrastructure.Queries;

public class PaymentConditionQueryService : IPaymentConditionQueryService
{
    private readonly IDbConnection _dbConnection;

    public PaymentConditionQueryService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<PaymentConditionResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT PaymentConditionId, Description, NumberOfInstallments, CreatedAt
            FROM PaymentConditions
            ORDER BY Description";

        return await _dbConnection.QueryAsync<PaymentConditionResponse>(sql);
    }

    public async Task<PaymentConditionResponse?> GetByIdAsync(int paymentConditionId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT PaymentConditionId, Description, NumberOfInstallments, CreatedAt
            FROM PaymentConditions
            WHERE PaymentConditionId = @PaymentConditionId";

        return await _dbConnection.QueryFirstOrDefaultAsync<PaymentConditionResponse>(sql, new { PaymentConditionId = paymentConditionId });
    }
}
