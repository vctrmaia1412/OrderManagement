namespace OrderManagement.Domain.Enums;

public enum OrderStatus
{
    Criado = 0,
    AguardandoAprovacao = 1,
    Aprovado = 2,
    Processando = 3,
    Pago = 4,
    Cancelado = 5
}
