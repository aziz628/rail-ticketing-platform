package com.sncft.app.schedule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ScheduleResponse(
    UUID id,
    String lineName,
    String trainName,
    String controllerName,
    String daysBitmask,
    LocalDate activationDate,
    LocalDate deactivationDate,
    Boolean canDelete,
    Boolean canDeactivate,
    LocalDate minDeactivationDate,
    List<ScheduleStopResponse> stops
) {
    public record ScheduleStopResponse(
        String stationName,
        LocalTime arrivalTime,
        double kmFromSource
    ) {}
}
