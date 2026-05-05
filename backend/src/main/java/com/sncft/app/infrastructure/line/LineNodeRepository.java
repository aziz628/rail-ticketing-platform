package com.sncft.app.infrastructure.line;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LineNodeRepository extends JpaRepository<LineNode, UUID> {
    boolean existsByStationId(UUID stationId);
}
