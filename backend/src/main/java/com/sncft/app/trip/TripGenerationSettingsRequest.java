package com.sncft.app.trip;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TripGenerationSettingsRequest(
    @NotNull(message = "L'activation automatique est obligatoire")
    Boolean autoGenerateEnabled,

    @Min(value = 7, message = "La période de génération doit être d'au moins 7 jours")
    @Max(value = 30, message = "La période de génération ne peut pas dépasser 30 jours")
    @NotNull(message = "La période de génération est obligatoire")
    int generationSpanDays) {
}
