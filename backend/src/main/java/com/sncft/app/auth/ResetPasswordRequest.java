package com.sncft.app.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    
    @NotBlank(message = "L'OTP est obligatoire")
    @Pattern(regexp = "[0-9]{8}", message = "L'OTP doit comporter 8 chiffres")
    String otp,
    
    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit comporter au moins 8 caractères")
    String newPassword,

    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    @Size(min = 8, message = "La confirmation du mot de passe doit comporter au moins 8 caractères")
    String confirmPassword
) {
}
