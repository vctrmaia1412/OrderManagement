using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record CreateUserRequest(
    [Required(ErrorMessage = "Username é obrigatório.")]
    [MinLength(3, ErrorMessage = "Username deve ter no mínimo 3 caracteres.")]
    string Username,

    [Required(ErrorMessage = "Senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres.")]
    string Password,

    [Required(ErrorMessage = "Nome completo é obrigatório.")]
    string FullName,

    [Required(ErrorMessage = "Email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email em formato inválido.")]
    string Email,

    [Required(ErrorMessage = "Role é obrigatória.")]
    string Role);
