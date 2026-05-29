package com.sncft.app.infrastructure.line;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

public interface LineRepository extends JpaRepository<Line, UUID> {
    Optional<Line> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);

    // make stations ordered by km_from_source
    @Query("SELECT DISTINCT l FROM Line l LEFT JOIN FETCH l.nodes n LEFT JOIN FETCH n.station s ORDER BY n.orderIndex ASC")
    Page<Line> findAllWithNodes(Pageable pageable);

    // find the lines with at least one controller, trip schedule or subscription request
    @Query("SELECT DISTINCT l.id FROM Line l WHERE l.id IN :lineIds AND (" +
           "EXISTS (SELECT cl FROM ControllerLine cl WHERE cl.line = l) OR " +
           "EXISTS (SELECT ts FROM TripSchedule ts WHERE ts.line = l) OR " +
           "EXISTS (SELECT sr FROM SubscriptionRequest sr WHERE sr.line = l))")
    List<UUID> findNonDeletableLineIds(@Param("lineIds") List<UUID> lineIds);
}
