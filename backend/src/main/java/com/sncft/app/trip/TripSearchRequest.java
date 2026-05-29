package com.sncft.app.trip;

import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

public record TripSearchRequest(
    @NotNull(message = "La station de départ est requise")
    UUID originId,

    @NotNull(message = "La station d'arrivée est requise")
    UUID destinationId,

    @NotNull(message = "La date du voyage est requise")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    LocalDate date
) {}
