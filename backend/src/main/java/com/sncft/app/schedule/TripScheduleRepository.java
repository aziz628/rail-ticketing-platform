package com.sncft.app.schedule;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TripScheduleRepository extends JpaRepository<TripSchedule, UUID> {

       // active  means they are enabled to generate when date reached , being currently used or not not concerns
       @Query("SELECT ts FROM TripSchedule ts " +
                     "JOIN FETCH ts.line " +
                     "JOIN FETCH ts.train " +
                     "JOIN FETCH ts.controller " +
                     "WHERE (ts.deactivationDate IS NULL OR ts.deactivationDate > :now) " +
                     "AND (:lineId IS NULL OR ts.line.id = :lineId)")
       Page<TripSchedule> findActiveSchedules(@Param("lineId") UUID lineId, @Param("now") LocalDate now,
                     Pageable pageable);

       @Query("SELECT ts FROM TripSchedule ts " +
                     "JOIN FETCH ts.line " +
                     "JOIN FETCH ts.train " +
                     "JOIN FETCH ts.controller " +
                     "WHERE (ts.deactivationDate IS NOT NULL AND ts.deactivationDate <= :now) " +
                     "AND (:lineId IS NULL OR ts.line.id = :lineId)")
       Page<TripSchedule> findInactiveSchedules(@Param("lineId") UUID lineId, @Param("now") LocalDate now,
                     Pageable pageable);

       // fetch schedules whose date window overlaps the sync span [spanStart, spanEnd]
       // a schedule is relevant if: activationDate <= spanEnd AND (deactivationDate IS NULL OR deactivationDate >= spanStart)
       @Query("SELECT DISTINCT ts FROM TripSchedule ts " +
                     "JOIN FETCH ts.line " +
                     "JOIN FETCH ts.train t " +
                     "WHERE ts.activationDate <= :spanEnd " +
                     "AND (ts.deactivationDate IS NULL OR ts.deactivationDate >= :spanStart)")
       List<TripSchedule> findSchedulesActiveInSpan(@Param("spanStart") LocalDate spanStart, @Param("spanEnd") LocalDate spanEnd);

       @Query("SELECT DISTINCT ts FROM TripSchedule ts " +
                     "JOIN FETCH ts.stops " +
                     "WHERE ts.controller.id = :controllerId " +
                     "AND (ts.deactivationDate IS NULL OR ts.deactivationDate >= CURRENT_DATE)")
       List<TripSchedule> findActiveByControllerId(@Param("controllerId") UUID controllerId);
}
