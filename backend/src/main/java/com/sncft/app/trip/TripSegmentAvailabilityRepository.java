package com.sncft.app.trip;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TripSegmentAvailabilityRepository extends JpaRepository<TripSegmentAvailability, UUID> {
}
