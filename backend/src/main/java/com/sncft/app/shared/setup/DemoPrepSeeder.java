package com.sncft.app.shared.setup;

import com.sncft.app.trip.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(99)
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DemoPrepSeeder implements CommandLineRunner {

    private final TripService tripService;

    @Override
    public void run(String... args) {
        log.info("Starting Demo Prep Seeder ...");
        try {
            // This will automatically generate the upcoming trips for the seeded schedules
            // and correctly populate Redis segment constraints.
            log.info("Syncing upcoming trips to ensure demo readiness...");
            tripService.syncUpcomingTrips(7);
            log.info("Trips synced successfully.");
        } catch (Exception e) {
            log.error("Failed to sync trips during demo prep", e);
        }
    }
}
