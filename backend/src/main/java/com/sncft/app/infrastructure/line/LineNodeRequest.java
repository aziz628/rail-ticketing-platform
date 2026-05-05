package com.sncft.app.infrastructure.line;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LineNodeRequest(
    @NotNull(message = "L'ID de la gare est obligatoire")
    UUID stationId,
    @Min(value = 0, message = "La distance ne peut pas être négative")
    double kmFromSource
) {}
