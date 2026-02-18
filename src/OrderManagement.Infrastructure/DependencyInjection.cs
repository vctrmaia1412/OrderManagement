using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OrderManagement.Application.Commands;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Interfaces;
using OrderManagement.Infrastructure.BackgroundServices;
using OrderManagement.Infrastructure.Data;
using OrderManagement.Infrastructure.Queries;
using OrderManagement.Infrastructure.Repositories;

namespace OrderManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")!;

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IDbConnection>(sp =>
            new SqlConnection(connectionString));

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<ICustomerQueryService, CustomerQueryService>();
        services.AddScoped<IPaymentConditionQueryService, PaymentConditionQueryService>();
        services.AddScoped<IOrderQueryService, OrderQueryService>();

        services.AddScoped<CreateCustomerCommandHandler>();
        services.AddScoped<CreatePaymentConditionCommandHandler>();
        services.AddScoped<CreateOrderCommandHandler>();
        services.AddScoped<ApproveOrderCommandHandler>();
        services.AddScoped<CancelOrderCommandHandler>();

        services.AddSingleton<IOrderProcessingQueue, InMemoryOrderProcessingQueue>();
        services.AddHostedService<OrderProcessingWorker>();

        return services;
    }
}
