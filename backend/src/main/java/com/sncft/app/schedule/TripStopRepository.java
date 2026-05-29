package com.sncft.app.schedule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

public interface TripStopRepository extends JpaRepository<TripStop, UUID> {
    
    @Query("SELECT s.arrivalTime FROM TripStop s " +
           "WHERE s.tripSchedule.id = :scheduleId " +
           "AND s.lineNode.station.id = :stationId")
    Optional<LocalTime> findArrivalTimeByScheduleIdAndStationId(
        @Param("scheduleId") UUID scheduleId, 
        @Param("stationId") UUID stationId
    );
}
