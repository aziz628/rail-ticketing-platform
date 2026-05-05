package com.sncft.app.infrastructure.train;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface TrainRepository extends JpaRepository<Train, UUID> {
    Optional<Train> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);

    // TODO: When Trip_Schedule is built, update this query:
    // @Query("SELECT t.id FROM Train t WHERE (SELECT COUNT(ts) FROM TripSchedule ts WHERE ts.train = t) > 0")
    @Query("SELECT t.id FROM Train t WHERE 1=0") // Dummy query for now
    List<UUID> findNonDeletableTrainIds(@Param("trainIds") List<UUID> trainIds);
}
