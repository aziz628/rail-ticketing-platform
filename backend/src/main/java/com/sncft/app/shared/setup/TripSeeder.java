package com.sncft.app.shared.setup;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import com.sncft.app.schedule.TripSchedule;
import com.sncft.app.schedule.TripScheduleRepository;
import com.sncft.app.schedule.TripStop;
import com.sncft.app.trip.TripGenerationSettings;
import com.sncft.app.trip.TripGenerationSettingsRepository;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(4) // After StaffSeeder
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class TripSeeder implements CommandLineRunner {

    private final TripScheduleRepository scheduleRepository;
    private final TripGenerationSettingsRepository settingsRepository;
    private final LineRepository lineRepository;
    private final TrainRepository trainRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional //  hibernate lazy load children when u access them , but without transactional db session close immediately before lazy loading children
    public void run(String... args) {
        seedSettings();
        seedSchedules();
    }

    private void seedSettings() {
        if (settingsRepository.count() == 0) {
            log.info("Seeding default Trip Generation Settings...");
            TripGenerationSettings settings = new TripGenerationSettings(1, true, 7);
            settingsRepository.save(settings);
            log.info("Default settings seeded successfully.");
        }
    }

    private void seedSchedules() {
        if (scheduleRepository.count() == 0) {
            log.info("Seeding initial Trip Schedules...");

            // Fetch dependencies
            Line line = lineRepository.findAll().stream().findFirst().orElse(null);
            Train train = trainRepository.findAll().stream().findFirst().orElse(null);
            User controller = userRepository.findByRole(UserRole.CONTROLLER).stream().findFirst().orElse(null);

            if (line == null || train == null || controller == null) {
                log.warn("Missing dependencies for TripSchedule seeding (Line, Train, or Controller). Skipping.");
                return;
            }

            // Create an Every-Day Schedule starting today
            TripSchedule everydaySchedule = TripSchedule.builder()
                    .line(line)
                    .train(train)
                    .controller(controller)
                    .daysBitmask("1111111")
                    .activationDate(LocalDate.now())
                    .deactivationDate(LocalDate.now().plusMonths(6))
                    .build();

            // Create stops based on line nodes
            List<TripStop> stops = new ArrayList<>();
            List<LineNode> nodes = line.getNodes();
            // add stops to Schedule
            for (int i = 0; i < nodes.size(); i++) {
                stops.add(TripStop.builder()
                        .tripSchedule(everydaySchedule)
                        .lineNode(nodes.get(i))
                        .arrivalTime(LocalTime.of(8, 0).plusHours(i)) // Simple 1-hour interval
                        .build());
            }
            everydaySchedule.setStops(stops);
            scheduleRepository.save(everydaySchedule);

            // Create a Weekend Schedule
            TripSchedule weekendSchedule = TripSchedule.builder()
                    .line(line)
                    .train(train)
                    .controller(controller)
                    .daysBitmask("0000011") // Sat, Sun
                    .activationDate(LocalDate.now())
                    .build();

            List<TripStop> weekendStops = new ArrayList<>();
            for (int i = 0; i < nodes.size(); i++) {
                weekendStops.add(TripStop.builder()
                        .tripSchedule(weekendSchedule)
                        .lineNode(nodes.get(i))
                        .arrivalTime(LocalTime.of(14, 0).plusHours(i * 2))
                        .build());
            }
            weekendSchedule.setStops(weekendStops);
            scheduleRepository.save(weekendSchedule);

            log.info("Initial schedules seeded successfully.");
        }
    }
}
