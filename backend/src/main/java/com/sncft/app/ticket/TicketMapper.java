package com.sncft.app.ticket;

import java.time.LocalTime;
import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.sncft.app.trip.Trip;

@Mapper(componentModel = "spring")
public interface TicketMapper {
    @Mapping(target = "tripNumber", source = "trip.tripSchedule.train.name")
    @Mapping(target = "date", source = "trip.date")
    @Mapping(target = "originStationName", source = "originStation.name")
    @Mapping(target = "destinationStationName", source = "destinationStation.name")
    @Mapping(target = "price", source = "finalPrice")
    @Mapping(target = "seatClassName", source = "seatClass.type")
    @Mapping(target = "departureTime", expression = "java(getArrivalTime(ticket.getTrip(), ticket.getOriginStation().getId()))")
    @Mapping(target = "arrivalTime", expression = "java(getArrivalTime(ticket.getTrip(), ticket.getDestinationStation().getId()))")
    TicketResponse toResponse(Ticket ticket);

    default LocalTime getArrivalTime(Trip trip, UUID stationId) {
        return trip.getTripSchedule().getStops().stream()
                .filter(stop -> stop.getLineNode().getStation().getId().equals(stationId))
                .findFirst()
                .map(com.sncft.app.schedule.TripStop::getArrivalTime)
                .orElse(null);
    }
}
