package com.sncft.app.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateControllerRequest(
    @NotBlank(message = "Le nom est obligatoire")
    String name,

    @NotBlank(message = "L'e-mail est obligatoire")
    @Email(message = "Format d'e-mail invalide")
    String email,

    @NotNull(message = "La ligne assignée est obligatoire")
    UUID lineId
) {}
