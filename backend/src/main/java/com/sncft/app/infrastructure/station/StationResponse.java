package com.sncft.app.infrastructure.station;

import java.util.UUID;

public record StationResponse(
    UUID id,
    String name,
    boolean canDelete
) {}
