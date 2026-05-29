package com.sncft.app.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import java.time.ZonedDateTime;


public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Page<Ticket> findAllByUserIdAndTrip_DateGreaterThanEqualOrderByTrip_DateAsc(UUID userId, LocalDate date, Pageable pageable);
    Page<Ticket> findAllByUserIdAndTrip_DateLessThanOrderByTrip_DateDesc(UUID userId, LocalDate date, Pageable pageable);

    boolean existsByOriginStationIdOrDestinationStationId(UUID originStationId, UUID destinationStationId);

    boolean existsByUserIdAndTripId(UUID userId, UUID tripId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = com.sncft.app.ticket.TicketStatus.PAID AND t.finalPrice > 0 AND t.createdAt >= :start AND t.createdAt < :end")
    long countTicketsSoldBetween(@org.springframework.data.repository.query.Param("start") java.time.ZonedDateTime start, @org.springframework.data.repository.query.Param("end") java.time.ZonedDateTime end);

    @Query("SELECT new com.sncft.app.dashboard.DailyTicketSales(CAST(t.createdAt AS LocalDate), COUNT(t)) " +
           "FROM Ticket t " +
           "WHERE t.status = com.sncft.app.ticket.TicketStatus.PAID AND t.finalPrice > 0 AND t.createdAt >= :startDate " +
           "GROUP BY CAST(t.createdAt AS LocalDate) " +
           "ORDER BY CAST(t.createdAt AS LocalDate) ASC")
    List<com.sncft.app.dashboard.DailyTicketSales> countDailyTicketsSold(@Param("startDate") ZonedDateTime startDate);
}
