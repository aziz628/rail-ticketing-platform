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

    @Query("SELECT DISTINCT cl.line.id FROM ControllerLine cl WHERE cl.line.id IN :lineIds")
    List<UUID> findNonDeletableLineIds(@Param("lineIds") List<UUID> lineIds);
}
