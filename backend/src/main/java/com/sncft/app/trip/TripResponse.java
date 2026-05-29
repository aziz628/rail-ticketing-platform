package com.sncft.app.trip;

import java.time.LocalDate;
import java.util.UUID;

public record TripResponse(
    UUID id,
    String lineName,
    String trainName,
    LocalDate date,
    String startStopName,
    String endStopName
) {}
