package com.sncft.app.shared.setup;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.schedule.TripSchedule;
import com.sncft.app.schedule.TripScheduleRepository;
import com.sncft.app.schedule.TripStop;
import com.sncft.app.trip.Trip;
import com.sncft.app.trip.TripGenerationSettings;
import com.sncft.app.trip.TripGenerationSettingsRepository;
import com.sncft.app.trip.TripRepository;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(5) // After StaffSeeder
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class TripSeeder implements CommandLineRunner {

    private final TripScheduleRepository scheduleRepository;
    private final TripGenerationSettingsRepository settingsRepository;
    private final TripRepository tripRepository;
    private final LineRepository lineRepository;
    private final TrainRepository trainRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedSettings();
        seedSchedulesAndPastTrips();
    }

    private void seedSettings() {
        if (settingsRepository.count() == 0) {
            settingsRepository.save(new TripGenerationSettings(1, true, 7));
            log.info("Trip generation settings seeded.");
        }
    }

    @Transactional
    private void seedSchedulesAndPastTrips() {
        if (scheduleRepository.count() > 0) {
            log.info("Schedules already seeded. Skipping.");
            return;
        }

        Line line = lineRepository.findAll().stream().findFirst().orElse(null);
        Train direct = trainRepository.findByNameIgnoreCase("Direct Climatisé").orElse(null);
        User controller = userRepository.findByRole(UserRole.CONTROLLER).stream().findFirst().orElse(null);

        if (line == null || direct == null || controller == null) {
            log.warn("Missing dependencies (Line, Train, Controller). Skipping TripSeeder.");
            return;
        }

        List<LineNode> nodes = line.getNodes();

        // --- Schedule 1: Active, every day, NO deactivation date (used for all trips) ---
        TripSchedule activeSchedule = TripSchedule.builder()
                .line(line).train(direct).controller(controller)
                .daysBitmask("1111111")
                .activationDate(LocalDate.now().minusMonths(2))
                .build();
        activeSchedule.setStops(buildStops(activeSchedule, nodes, LocalTime.of(8, 0)));
        scheduleRepository.save(activeSchedule);

        // Seed 30 past trips on this schedule for dashboard stats
        log.info("Seeding 30 past trips for stats...");
        for (int d = 1; d <= 30; d++) {
            Trip trip = tripRepository.save(Trip.builder()
                    .tripSchedule(activeSchedule)
                    .date(LocalDate.now().minusDays(d))
                    .ticketCount(0)
                    .deleted(false)
                    .build());
            log.info("Trip {} seeded.", trip);
        }

        // --- Schedule 2: Already deactivated (shows in "Deactivated" tab) ---
        TripSchedule deactivatedSchedule = TripSchedule.builder()
                .line(line).train(direct).controller(controller)
                .daysBitmask("1111111")
                .activationDate(LocalDate.now().minusMonths(6))
                .deactivationDate(LocalDate.now().minusDays(30)) // deactivated a month ago
                .build();
        deactivatedSchedule.setStops(buildStops(deactivatedSchedule, nodes, LocalTime.of(14, 0)));
        scheduleRepository.save(deactivatedSchedule);

        log.info("Schedules seeded. 3rd schedule will be created live in demo.");
    }

    private List<TripStop> buildStops(TripSchedule schedule, List<LineNode> nodes, LocalTime startTime) {
        List<TripStop> stops = new ArrayList<>();
        for (int i = 0; i < nodes.size(); i++) {
            stops.add(TripStop.builder()
                    .tripSchedule(schedule)
                    .lineNode(nodes.get(i))
                    .arrivalTime(startTime.plusHours(i))
                    .build());
        }
        return stops;
    }
}
