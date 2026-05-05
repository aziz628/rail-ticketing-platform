package com.sncft.app.infrastructure.line;


public record LineNodeResponse(
    String stationName,
    double kmFromSource,
    int orderIndex
) {}
