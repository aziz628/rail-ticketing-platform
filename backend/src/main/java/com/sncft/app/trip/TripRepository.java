package com.sncft.app.trip;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    
    long countByTripScheduleId(UUID tripScheduleId);

    @Query("SELECT DISTINCT t.tripSchedule.id FROM Trip t WHERE t.tripSchedule.id IN :ids")
    Set<UUID> findScheduleIdsWithTrips(@Param("ids") Collection<UUID> ids);

    @Query("SELECT t.tripSchedule.id, MAX(t.date) FROM Trip t WHERE t.tripSchedule.id IN :ids GROUP BY t.tripSchedule.id")
    List<Object[]> findLatestTripDatesForSchedules(@Param("ids") Collection<UUID> ids);

    // bulk fetch: returns existing trip dates in span for a set of schedules
    @Query("SELECT t.tripSchedule.id, t.date FROM Trip t " +
           "WHERE t.tripSchedule.id IN :ids AND t.date BETWEEN :start AND :end")
    List<Object[]> findExistingTripsDatesForScheduleIds(
            @Param("ids") Collection<UUID> ids,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    // get paginated trips for a line and date
    @Query("SELECT t FROM Trip t " +
       "JOIN FETCH t.tripSchedule ts " +
       "JOIN FETCH ts.line l " +
       "JOIN FETCH ts.train tr " +
       "WHERE (CAST(:lineId AS java.util.UUID) IS NULL OR l.id = :lineId) " +
       "AND (CAST(:date AS java.time.LocalDate) IS NULL OR t.date = :date)")
    Page<Trip> findTrips(@Param("lineId") UUID lineId, @Param("date") LocalDate date, Pageable pageable);


    // search trips by origin and destination stations on a given date
    // verify stops exist and ordered for the given line
    @Query("SELECT DISTINCT t FROM Trip t " +
           "JOIN t.tripSchedule ts " +
           "JOIN ts.stops stop1 " +
           "JOIN ts.stops stop2 " +
           "WHERE t.date = :date " +
           "AND t.deleted = false " +
           "AND stop1.lineNode.id = :originId " +
           "AND stop2.lineNode.id = :destinationId " +
           "AND stop1.lineNode.orderIndex < stop2.lineNode.orderIndex")
    Page<Trip> searchTrips(
            @Param("originId") UUID originId,
            @Param("destinationId") UUID destinationId,
            @Param("date") LocalDate date,
            Pageable pageable);

}
