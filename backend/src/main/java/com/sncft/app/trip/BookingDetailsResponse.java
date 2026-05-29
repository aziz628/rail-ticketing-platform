package com.sncft.app.trip;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BookingDetailsResponse(
    UUID tripId,
    String originName,
    String destinationName,
    @JsonFormat(pattern = "HH:mm") LocalTime departureTime,
    @JsonFormat(pattern = "HH:mm") LocalTime arrivalTime,
    LocalDate date,
    String trainName,
    Boolean isAlreadyBought,
    Boolean userBlocked,
    Boolean freeBookingAllowed,
    List<SeatClassPriceResponse> seatClasses
) {}
