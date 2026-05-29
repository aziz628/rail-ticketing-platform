package com.sncft.app.trip;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

public record TripSearchResponse(
    UUID tripId,
    String lineName,
    String trainName,
    String originStationName,
    String destinationStationName,
    @JsonFormat(pattern = "HH:mm") LocalTime departureTime,
    @JsonFormat(pattern = "HH:mm") LocalTime arrivalTime,
    LocalDate date,
    boolean bookingDeadlineExpired,
    boolean hasAvailableSeats
) {}
