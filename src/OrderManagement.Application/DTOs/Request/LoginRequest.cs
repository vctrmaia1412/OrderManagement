using System.ComponentModel.DataAnnotations;

namespace OrderManagement.Application.DTOs.Request;

public record LoginRequest(
    [Required(ErrorMessage = "Usuário é obrigatório.")]
    string Username,

    [Required(ErrorMessage = "Senha é obrigatória.")]
    string Password);
