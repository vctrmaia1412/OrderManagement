using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record ChangePasswordRequest(
    [Required(ErrorMessage = "Nova senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres.")]
    string NewPassword);
