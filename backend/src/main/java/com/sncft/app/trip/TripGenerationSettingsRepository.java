package com.sncft.app.trip;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TripGenerationSettingsRepository extends JpaRepository<TripGenerationSettings, Integer> {
    
    // return setting , "default" keyword means only one row in db
    default Optional<TripGenerationSettings> getSettings() {
        return findById(1);
    }
}
