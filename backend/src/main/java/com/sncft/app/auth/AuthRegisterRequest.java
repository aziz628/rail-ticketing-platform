package com.sncft.app.auth;

import com.sncft.app.user.NationalIdType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record AuthRegisterRequest(
        @NotNull(message = "Le type de document d'identité est requis")
        NationalIdType nationalIdType,
        
        @NotBlank(message = "Le numéro d'identité est requis")
        @Pattern(regexp = "^(.{8}|.{12})$", message = "Le numéro d'identité doit comporter 8 ou 12 caractères")
        String nationalIdNumber,
        
        @NotBlank(message = "L'adresse e-mail est requise")
        @Email(message = "L'adresse e-mail n'est pas valide")
        String email,
        
        @NotBlank(message = "Le mot de passe est requis")
        @Size(min = 8, max = 255, message = "Le mot de passe doit comporter entre 8 et 255 caractères")
        String password
) {
}
