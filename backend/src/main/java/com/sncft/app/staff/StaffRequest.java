package com.sncft.app.staff;

import com.sncft.app.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record StaffRequest(
    @NotBlank(message = "Le nom est obligatoire")
    String name,
    
    @NotBlank(message = "L'e-mail est obligatoire")
    @Email(message = "Format d'e-mail invalide")
    String email,

    @NotBlank(message = "Le numéro d'identité nationale est obligatoire")
    String nationalIdNumber,

    @NotBlank(message = "Le type d'identité nationale est obligatoire")
    String nationalIdType,
    
    @NotNull(message = "Le rôle est obligatoire")
    UserRole role,
    
    // Only required if role is CONTROLEUR
    UUID lineId
) {}
