package com.sncft.app.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateAgentRequest(
    @NotBlank(message = "Le nom est obligatoire")
    String name,

    @NotBlank(message = "L'e-mail est obligatoire")
    @Email(message = "Format d'e-mail invalide")
    String email
) {}
