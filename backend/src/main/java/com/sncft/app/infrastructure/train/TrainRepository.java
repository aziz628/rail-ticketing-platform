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

    // find the trains with at least one trip schedule
    @Query("SELECT t.id FROM Train t WHERE t.id IN :trainIds AND " +
           "EXISTS (SELECT ts FROM TripSchedule ts WHERE ts.train = t)")
    List<UUID> findNonDeletableTrainIds(@Param("trainIds") List<UUID> trainIds);
}
