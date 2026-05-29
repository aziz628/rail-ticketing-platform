package com.sncft.app.infrastructure.station;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.UUID;
import java.util.Optional;

public interface StationRepository extends JpaRepository<Station, UUID> {
    Optional<Station> findByNameIgnoreCase(String name); 
    boolean existsByNameIgnoreCase(String name);
    
    // find stations with no LineNode or Ticket linked
    @Query("SELECT new com.sncft.app.infrastructure.station.StationResponse(s.id, s.name, " +
           "(SELECT count(ln) = 0 FROM LineNode ln WHERE ln.station = s) AND " +
           "(SELECT count(t) = 0 FROM Ticket t WHERE t.originStation = s OR t.destinationStation = s)) " +
           "FROM Station s ORDER BY s.name ASC")
    Page<StationResponse> findAllWithDeleteFlag(Pageable pageable);
}
