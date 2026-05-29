package com.sncft.app.trip;

public record TripGenerationSettingsResponse(
    boolean autoGenerateEnabled,
    int generationSpanDays
) {}
