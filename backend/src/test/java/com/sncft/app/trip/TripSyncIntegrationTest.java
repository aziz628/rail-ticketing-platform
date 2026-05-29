package com.sncft.app.trip;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.infrastructure.line.LineNodeRepository;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.infrastructure.train.SeatClass;
import com.sncft.app.infrastructure.train.SeatClassType;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import com.sncft.app.schedule.TripSchedule;
import com.sncft.app.schedule.TripScheduleRepository;
import com.sncft.app.schedule.TripStop;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TripSyncIntegrationTest {

    @Autowired private TripService tripService;
    @Autowired private TripRepository tripRepository;
    @Autowired private TripScheduleRepository scheduleRepository;
    @Autowired private TripGenerationSettingsRepository settingsRepository;
    @Autowired private LineRepository lineRepository;
    @Autowired private LineNodeRepository lineNodeRepository;
    @Autowired private TrainRepository trainRepository;
    @Autowired private StationRepository stationRepository;
    @Autowired private UserRepository userRepository;


    @BeforeEach
    void setUp() {
        // Standard cleanup pattern
        tripRepository.deleteAll();
        scheduleRepository.deleteAll();
        lineNodeRepository.deleteAll();
        lineRepository.deleteAll();
        stationRepository.deleteAll();
        trainRepository.deleteAll();
        userRepository.deleteAll();

        // Setup minimal infrastructure
        User admin = userRepository.save(User.builder().name("Admin").email("admin@sncft.tn").password("pass").role(UserRole.ADMIN).build());
        
        Line line = lineRepository.save(Line.builder().name("Tunis-Sousse").build());
        Station s1 = stationRepository.save(Station.builder().name("Tunis").build());
        Station s2 = stationRepository.save(Station.builder().name("Sousse").build());

        Train train = Train.builder().name("Express").basePriceIncreasePercentage(BigDecimal.ZERO).build();
        train.setSeatClasses(List.of(
            SeatClass.builder().type(SeatClassType.FIRST).capacity(50).priceIncreasePercentage(BigDecimal.TEN).train(train).build()
        ));
        trainRepository.save(train);

        // Create a schedule active for the next 10 days, running every day (bitmask 1111111)
        TripSchedule schedule = TripSchedule.builder()
                .line(line).train(train).controller(admin)
                .daysBitmask("1111111")
                .activationDate(LocalDate.now())
                .deactivationDate(LocalDate.now().plusDays(10))
                .build();

        // line nodes
        LineNode node1 = lineNodeRepository.save(LineNode.builder().line(line).station(s1).orderIndex(0).kmFromSource(0).build());
        LineNode node2 = lineNodeRepository.save(LineNode.builder().line(line).station(s2).orderIndex(1).kmFromSource(140).build());

        // schedule set stops
        schedule.setStops(List.of(
            TripStop.builder().lineNode(node1).arrivalTime(LocalTime.of(8,0)).tripSchedule(schedule).build(),
            TripStop.builder().lineNode(node2).arrivalTime(LocalTime.of(10,0)).tripSchedule(schedule).build()
        ));
        // save schedule
        scheduleRepository.save(schedule);

        // set settings
        settingsRepository.deleteAll();
        settingsRepository.save(new TripGenerationSettings(1, true, 7));
    }

    @Test
    void syncUpcomingTrips_ShouldGenerateMissingTrips() {
        // Sync for 3 days
        tripService.syncUpcomingTrips(3);

        List<Trip> trips = tripRepository.findAll();
        assertEquals(4, trips.size(), "Should generate trips for [Today, T+1, T+2, T+3]");
        
        // Verify segments
        Trip firstTrip = trips.get(0);
        assertFalse(firstTrip.getSegmentAvailabilities().isEmpty());
        assertEquals(1, firstTrip.getSegmentAvailabilities().size(), "1 segment for 2 stops");
    }

    @Test
    void syncUpcomingTrips_ShouldBeIdempotent() {
        // Sync twice
        tripService.syncUpcomingTrips(3);
        long countFirst = tripRepository.count();
        
        tripService.syncUpcomingTrips(3);
        long countSecond = tripRepository.count();

        // Assert that second have no effect
        assertEquals(countFirst, countSecond, "Second sync should not create duplicates");
    }

    @Test
    void scheduledSync_ShouldRespectSettings() {
        // Disable auto-generation
        TripGenerationSettings settings = settingsRepository.getSettings().get();
        settings.setAutoGenerateEnabled(false);
        settingsRepository.save(settings);

        // Call the scheduled method directly
        tripService.scheduledSync();

        // Verify no trips created
        assertEquals(0, tripRepository.count(), "Scheduled sync should do nothing if disabled");

        // Enable and try again
        settings.setAutoGenerateEnabled(true);
        settings.setGenerationSpanDays(2);
        settingsRepository.save(settings);
        
        tripService.scheduledSync();
        
        // Assert that Span 2 means [Today, T+1, T+2] 
        assertEquals(3, tripRepository.count());
    }
}
