using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record CreatePaymentConditionRequest(
    [Required(ErrorMessage = "Descrição é obrigatória.")]
    [MinLength(2, ErrorMessage = "Descrição deve ter no mínimo 2 caracteres.")]
    string Description,

    [Range(1, 48, ErrorMessage = "Número de parcelas deve ser entre 1 e 48.")]
    int NumberOfInstallments);
