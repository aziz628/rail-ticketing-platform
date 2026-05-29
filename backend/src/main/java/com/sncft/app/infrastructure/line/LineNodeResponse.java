package com.sncft.app.infrastructure.line;

import java.util.UUID;


public record LineNodeResponse(
    UUID id,
    String stationName,
    double kmFromSource,
    int orderIndex
) {}
