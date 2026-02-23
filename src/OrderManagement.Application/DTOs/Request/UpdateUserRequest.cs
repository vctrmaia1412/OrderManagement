using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record UpdateUserRequest(
    [Required(ErrorMessage = "Nome completo é obrigatório.")]
    string FullName,

    [Required(ErrorMessage = "Email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email em formato inválido.")]
    string Email,

    [Required(ErrorMessage = "Role é obrigatória.")]
    string Role,

    bool IsActive);
