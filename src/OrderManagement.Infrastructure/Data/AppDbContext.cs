using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<PaymentCondition> PaymentConditions => Set<PaymentCondition>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<DeliveryTerm> DeliveryTerms => Set<DeliveryTerm>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<PaymentCondition>().HasData(
            new { PaymentConditionId = 1, Description = "À Vista", NumberOfInstallments = 1, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 2, Description = "7 DDL", NumberOfInstallments = 1, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 3, Description = "14 DDL", NumberOfInstallments = 1, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 4, Description = "28 DDL", NumberOfInstallments = 1, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 5, Description = "30 DDL", NumberOfInstallments = 1, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 6, Description = "30/60 DDL", NumberOfInstallments = 2, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 7, Description = "30/60/90 DDL", NumberOfInstallments = 3, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { PaymentConditionId = 8, Description = "30/60/90/120 DDL", NumberOfInstallments = 4, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<Customer>().HasData(
            new { CustomerId = 1, Name = "Atacadão S.A.", Email = "compras@atacadao.com.br", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 2, Name = "Carrefour Comércio e Indústria Ltda", Email = "compras@carrefour.com.br", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 3, Name = "GPA - Grupo Pão de Açúcar", Email = "compras@gpabr.com", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 4, Name = "Assaí Atacadista", Email = "compras@assai.com.br", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 5, Name = "Makro Atacadista S.A.", Email = "compras@makro.com.br", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 6, Name = "Distribuidora Redfox Alimentos", Email = "pedidos@redfox.com.br", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 7, Name = "Frigorífico Silva Exportação", Email = "comercial@frigsilva.com.br", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { CustomerId = 8, Name = "Saudi Agricultural & Livestock Investment Co.", Email = "import@salic.com.sa", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<User>().HasData(
            new { UserId = 1, Username = "admin", PasswordHash = "$2a$11$aB3QnqEfruxxXDgnEUkRGekcjXL/wGMLs7bbQmOnLheSwTYdMf3oK", FullName = "Administrador do Sistema", Email = "admin@minervafoods.com", Role = "Admin", IsActive = true, CreatedAt = seedDate },
            new { UserId = 2, Username = "gerente", PasswordHash = "$2a$11$D3NMdZCWfoSdSVvds7KMZ.Z1KmxAV3TmeiIugEWevvCtGF8brbybq", FullName = "Carlos Gerente", Email = "carlos.gerente@minervafoods.com", Role = "Manager", IsActive = true, CreatedAt = seedDate },
            new { UserId = 3, Username = "joao", PasswordHash = "$2a$11$RwD.Q3x9eRuWv5He3Zd4fOubcXx48BkPlFZK1fLMCNUzGjFwRT9tC", FullName = "João Silva", Email = "joao.silva@minervafoods.com", Role = "User", IsActive = true, CreatedAt = seedDate },
            new { UserId = 4, Username = "maria", PasswordHash = "$2a$11$w23qC4MfVc6QEGRFJ8cJgu42gqTXYD4XPMSKanaCTAKfObbElzGpC", FullName = "Maria Santos", Email = "maria.santos@minervafoods.com", Role = "User", IsActive = true, CreatedAt = seedDate }
        );

        base.OnModelCreating(modelBuilder);
    }
}
