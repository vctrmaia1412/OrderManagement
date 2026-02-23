using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record CreateCustomerRequest(
    [Required(ErrorMessage = "Nome do cliente é obrigatório.")]
    [MinLength(2, ErrorMessage = "Nome deve ter no mínimo 2 caracteres.")]
    string Name,

    [Required(ErrorMessage = "Email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email em formato inválido.")]
    string Email);
