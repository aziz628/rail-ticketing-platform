package com.sncft.app.trip;

import java.time.LocalTime;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TripMapper {

    @Mapping(target = "lineName", source = "tripSchedule.line.name")
    @Mapping(target = "trainName", source = "tripSchedule.train.name")
    // first on nodes list means first stop on the line , mapping when given ".first" it mean first element in the list 
    @Mapping(target = "startStopName", source = "tripSchedule.line.nodes.first.station.name")
    @Mapping(target = "endStopName", source = "tripSchedule.line.nodes.last.station.name")
    TripResponse toResponse(Trip trip);
    
    
    @Mapping(target = "tripId", source = "trip.id")
    @Mapping(target = "lineName", source = "trip.tripSchedule.line.name")
    @Mapping(target = "trainName", source = "trip.tripSchedule.train.name")
    @Mapping(target = "date", source = "trip.date")
    TripSearchResponse toSearchResponse(
            Trip trip, 
            String originStationName, 
            String destinationStationName, 
            LocalTime departureTime, 
            LocalTime arrivalTime, 
            boolean bookingDeadlineExpired,
            boolean hasAvailableSeats
        );

    TripGenerationSettingsResponse toResponse(TripGenerationSettings settings);
}
