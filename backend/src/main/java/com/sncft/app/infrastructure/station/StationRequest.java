package com.sncft.app.infrastructure.station;

import jakarta.validation.constraints.NotBlank;

public record StationRequest(
    @NotBlank(message = "Le nom de la gare est obligatoire")
    String name
) {}
