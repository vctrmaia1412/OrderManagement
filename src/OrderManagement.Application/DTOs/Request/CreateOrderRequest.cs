using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record CreateOrderRequest(
    [Required(ErrorMessage = "Cliente é obrigatório.")]
    int CustomerId,

    [Required(ErrorMessage = "Condição de pagamento é obrigatória.")]
    int PaymentConditionId,

    [Required(ErrorMessage = "Itens são obrigatórios.")]
    [MinLength(1, ErrorMessage = "O pedido deve ter ao menos 1 item.")]
    List<CreateOrderItemRequest> Items);

public record CreateOrderItemRequest(
    [Required(ErrorMessage = "Nome do produto é obrigatório.")]
    [MinLength(1, ErrorMessage = "Nome do produto não pode ser vazio.")]
    string ProductName,

    [Range(1, int.MaxValue, ErrorMessage = "Quantidade deve ser maior que zero.")]
    int Quantity,

    [Range(0.01, double.MaxValue, ErrorMessage = "Preço unitário deve ser maior que zero.")]
    decimal UnitPrice);
