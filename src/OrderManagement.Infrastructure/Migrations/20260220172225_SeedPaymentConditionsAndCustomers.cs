using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OrderManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedPaymentConditionsAndCustomers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "CustomerId", "CreatedAt", "Email", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "compras@atacadao.com.br", "Atacadão S.A." },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "compras@carrefour.com.br", "Carrefour Comércio e Indústria Ltda" },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "compras@gpabr.com", "GPA - Grupo Pão de Açúcar" },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "compras@assai.com.br", "Assaí Atacadista" },
                    { 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "compras@makro.com.br", "Makro Atacadista S.A." },
                    { 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "pedidos@redfox.com.br", "Distribuidora Redfox Alimentos" },
                    { 7, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "comercial@frigsilva.com.br", "Frigorífico Silva Exportação" },
                    { 8, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "import@salic.com.sa", "Saudi Agricultural & Livestock Investment Co." }
                });

            migrationBuilder.InsertData(
                table: "PaymentConditions",
                columns: new[] { "PaymentConditionId", "CreatedAt", "Description", "NumberOfInstallments" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "À Vista", 1 },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "7 DDL", 1 },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "14 DDL", 1 },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "28 DDL", 1 },
                    { 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "30 DDL", 1 },
                    { 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "30/60 DDL", 2 },
                    { 7, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "30/60/90 DDL", 3 },
                    { 8, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "30/60/90/120 DDL", 4 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "PaymentConditions",
                keyColumn: "PaymentConditionId",
                keyValue: 8);
        }
    }
}
