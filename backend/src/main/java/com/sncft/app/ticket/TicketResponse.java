package com.sncft.app.ticket;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

public record TicketResponse(
    UUID id,
    String tripNumber,
    LocalDate date,
    String originStationName,
    String destinationStationName,
    @JsonFormat(pattern = "HH:mm") LocalTime departureTime,
    @JsonFormat(pattern = "HH:mm") LocalTime arrivalTime,
    String seatClassName,
    BigDecimal price,
    TicketStatus status 
) {}
