using System.Data;
using Dapper;
using OrderManagement.Application.DTOs.Response;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Infrastructure.Queries;

public class OrderQueryService : IOrderQueryService
{
    private readonly IDbConnection _dbConnection;

    public OrderQueryService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<OrderResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT 
                o.OrderId,
                o.CustomerId,
                c.Name AS CustomerName,
                o.PaymentConditionId,
                pc.Description AS PaymentConditionDescription,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                o.RequiresManualApproval,
                o.CreatedAt
            FROM Orders o
            INNER JOIN Customers c ON c.CustomerId = o.CustomerId
            INNER JOIN PaymentConditions pc ON pc.PaymentConditionId = o.PaymentConditionId
            ORDER BY o.OrderDate DESC";

        return await _dbConnection.QueryAsync<OrderResponse>(sql);
    }

    public async Task<OrderDetailResponse?> GetByIdAsync(int orderId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT 
                o.OrderId,
                o.CustomerId,
                c.Name AS CustomerName,
                o.PaymentConditionId,
                pc.Description AS PaymentConditionDescription,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                o.RequiresManualApproval,
                o.CreatedAt
            FROM Orders o
            INNER JOIN Customers c ON c.CustomerId = o.CustomerId
            INNER JOIN PaymentConditions pc ON pc.PaymentConditionId = o.PaymentConditionId
            WHERE o.OrderId = @OrderId;

            SELECT OrderItemId, ProductName, Quantity, UnitPrice, TotalPrice
            FROM OrderItems
            WHERE OrderId = @OrderId;

            SELECT DeliveryTermId, EstimatedDeliveryDate, DeliveryDays, CreatedAt
            FROM DeliveryTerms
            WHERE OrderId = @OrderId";

        using var multi = await _dbConnection.QueryMultipleAsync(sql, new { OrderId = orderId });

        var order = await multi.ReadFirstOrDefaultAsync<OrderDetailResponse>();
        if (order is null)
            return null;

        var items = (await multi.ReadAsync<OrderItemResponse>()).ToList();
        var deliveryTerm = await multi.ReadFirstOrDefaultAsync<DeliveryTermResponse>();

        return order with { Items = items, DeliveryTerm = deliveryTerm };
    }
}
