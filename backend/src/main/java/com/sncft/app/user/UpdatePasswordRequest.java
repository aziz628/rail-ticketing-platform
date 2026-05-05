package com.sncft.app.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequest(
    @NotBlank(message = "L'ancien mot de passe est obligatoire")
    String oldPassword,

    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit comporter au moins 8 caractères")
    String newPassword,

    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    String confirmPassword
) {
}
