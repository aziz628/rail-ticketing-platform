package com.sncft.app.shared.setup;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.infrastructure.train.SeatClass;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import com.sncft.app.subscription.*;
import com.sncft.app.ticket.*;
import com.sncft.app.trip.*;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
 
@Component
@Order(100)
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class StatsSeeder implements CommandLineRunner {

    private final TicketRepository ticketRepository;
    private final TransactionRepository transactionRepository;
    private final TripRepository tripRepository;
    private final TripSegmentAvailabilityRepository segmentAvailabilityRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final TrainRepository trainRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionRequestRepository subscriptionRequestRepository;
    private final SubscriptionCategoryRepository subscriptionCategoryRepository;
    private final LineRepository lineRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (ticketRepository.count() > 0) {
            log.info("Stats already seeded. Skipping.");
            return;
        }

        Station tunis = stationRepository.findByNameIgnoreCase("Tunis").orElse(null);
        Station sousse = stationRepository.findByNameIgnoreCase("Sousse").orElse(null);
        Line line1 = lineRepository.findAll().stream().findFirst().orElse(null);
        Train direct = trainRepository.findByNameIgnoreCase("Direct Climatisé").orElse(null);
        User ahmed = userRepository.findByEmail("ahmed@sncft.tn").orElse(null);
        User agent1 = userRepository.findByEmail("agent@sncft.tn").orElse(null);
        Optional<SubscriptionCategory> category = subscriptionCategoryRepository.findByName(SubscriptionCategoryType.CIVIL);

        List<User> ghosts = userRepository.findByRole(UserRole.VOYAGER).stream()
                .filter(u -> u.getNationalIdNumber().startsWith("20199"))
                .toList();

        if (tunis == null || sousse == null || line1 == null || direct == null || ahmed == null || category == null) {
            log.warn("Missing dependencies for StatsSeeder. Skipping.");
            return;
        }

        SeatClass seatClass = direct.getSeatClasses().stream().findFirst().orElse(null);
        if (seatClass == null) return;

        List<Trip> allTrips = tripRepository.findAll();
        List<Trip> pastTrips = allTrips.stream().filter(t -> t.getDate().isBefore(LocalDate.now())).toList();
        List<Trip> futureTrips = allTrips.stream().filter(t -> !t.getDate().isBefore(LocalDate.now())).toList();

        // ---- 1. Historical tickets for stats (spread over past trips) ----
        log.info("Seeding historical tickets for {} past trips...", pastTrips.size());
        
        int tripIndex = 0;
        for (Trip trip : pastTrips) {
            int ticketsToBuy = 3; // Exactly 3 tickets per day to spread evenly
            ZonedDateTime ticketDate = trip.getDate().minusDays(1).atTime(10, 0).atZone(ZoneId.systemDefault());
            log.info("Seeding {} tickets for trip on {}", ticketsToBuy, trip.getDate());
            for (int i = 0; i < ticketsToBuy; i++) {
                // Predictably pick unique ghosts by shifting based on tripIndex and i
                User ghost = ghosts.isEmpty() ? ahmed : ghosts.get((tripIndex + i) % ghosts.size());
                Ticket ticket = saveTicket(ghost, trip, tunis, sousse, seatClass, "25.00", ticketDate);
                log.info("Ticket seeded for user {} on date {}", ghost.getId(), ticket.getCreatedAt());
                saveTransaction(ghost, ticket.getId(), "TICKET", "25.00", ticketDate);
                
                ticketDate = ticketDate.plusHours(2); // spread within the day
            }
            
            trip.setTicketCount(ticketsToBuy);
            tripRepository.save(trip);
            tripIndex++;
        }

        // ---- 2. Ahmed's upcoming ticket (for PDF/consult demo) ----
        if (!futureTrips.isEmpty()) {
            Trip upcomingTrip = futureTrips.get(0);
            Ticket ahmedTicket = saveTicket(ahmed, upcomingTrip, tunis, sousse, seatClass, "25.00", ZonedDateTime.now());
            saveTransaction(ahmed, ahmedTicket.getId(), "TICKET", "25.00", ZonedDateTime.now());
            log.info("Ahmed's upcoming ticket seeded for trip on {}.", upcomingTrip.getDate());
        }

        // ---- 3. Ahmed's expired ticket (past trip) ----
        if (!pastTrips.isEmpty()) {
            Trip expiredTrip = pastTrips.get(0);
            Ticket expiredTicket = saveTicket(ahmed, expiredTrip, tunis, sousse, seatClass, "25.00", expiredTrip.getDate().minusDays(1).atTime(10, 0).atZone(ZoneId.systemDefault()));
            saveTransaction(ahmed, expiredTicket.getId(), "TICKET", "25.00", expiredTrip.getDate().minusDays(1).atTime(10, 0).atZone(ZoneId.systemDefault()));
            log.info("Ahmed's expired ticket seeded.");
        }

        // ---- 4. "Almost full" trip: 9/10 seats taken ----
        if (futureTrips.size() > 1) {
            Trip almostFullTrip = futureTrips.get(futureTrips.size() - 1);
            log.info("Prepping almost-full trip on {}...", almostFullTrip.getDate());
            for (int i = 0; i < 9; i++) {
                User ghost = ghosts.isEmpty() ? ahmed : ghosts.get(i % ghosts.size());
                Ticket t = saveTicket(ghost, almostFullTrip, tunis, sousse, seatClass, "18.00", ZonedDateTime.now());
                saveTransaction(ghost, t.getId(), "TICKET", "18.00", ZonedDateTime.now());
            }
            // Reduce segment availability by 9
            segmentAvailabilityRepository.findAll().stream()
                    .filter(s -> s.getTrip().getId().equals(almostFullTrip.getId()))
                    .filter(s -> s.getSeatClass().getId().equals(seatClass.getId()))
                    .forEach(s -> {
                        s.setAvailableSeats(Math.max(1, s.getAvailableSeats() - 9));
                        segmentAvailabilityRepository.save(s);
                    });
            almostFullTrip.setTicketCount(9);
            tripRepository.save(almostFullTrip);
            log.info("Almost-full trip prepped: 9/10 seats taken.");
        }

        // ---- 5. Ahmed's REJECTED subscription request ----
        if (agent1 != null) {
            SubscriptionRequest rejected = SubscriptionRequest.builder()
                    .user(ahmed).line(line1).category(category.get()).agent(agent1)
                    .duration(SubscriptionDuration.MONTHLY)
                    .status(SubscriptionRequestStatus.REJECTED)
                    .rejectReason("Document justificatif illisible. Veuillez soumettre une copie claire.")
                    .proofFilename("cin_ahmed.jpg")
                    .createdAt(ZonedDateTime.now().minusDays(5))
                    .build();
            subscriptionRequestRepository.save(rejected);
            log.info("Ahmed's REJECTED subscription request seeded.");

            // ---- 6. Ahmed's EXPIRED subscription ----
            SubscriptionRequest expiredReq = SubscriptionRequest.builder()
                    .user(ahmed).line(line1).category(category.get()).agent(agent1)
                    .duration(SubscriptionDuration.MONTHLY)
                    .status(SubscriptionRequestStatus.APPROVED)
                    .proofFilename("cin_ahmed.jpg")
                    .createdAt(ZonedDateTime.now().minusDays(45))
                    .build();
            subscriptionRequestRepository.save(expiredReq);

            Subscription expiredSub = Subscription.builder()
                    .user(ahmed).request(expiredReq)
                    .expireDate(LocalDate.now().minusDays(10))
                    .status(SubscriptionStatus.EXPIRED)
                    .build();
            subscriptionRepository.save(expiredSub);
            saveTransaction(ahmed, expiredSub.getId(), "SUBSCRIPTION", "45.00", ZonedDateTime.now().minusDays(45));
            log.info("Ahmed's EXPIRED subscription seeded.");

            // ---- 7. Agent 1's processed history ----
            for (int i = 0; i < Math.min(ghosts.size(), 4); i++) {
                User ghost = ghosts.get(i);
                SubscriptionRequestStatus randomStatus = (i % 2 == 0) ? SubscriptionRequestStatus.APPROVED : SubscriptionRequestStatus.REJECTED;
                SubscriptionRequest req = SubscriptionRequest.builder()
                        .user(ghost).line(line1).category(category.get()).agent(agent1)
                        .duration(SubscriptionDuration.MONTHLY)
                        .status(randomStatus)
                        .rejectReason(randomStatus == SubscriptionRequestStatus.REJECTED ? "Document non valide." : null)
                        .proofFilename("proof.jpg")
                        .createdAt(ZonedDateTime.now().minusDays(3 + i))
                        .build();
                subscriptionRequestRepository.save(req);

                // Create ACTIVE subscription for approved ones
                if (randomStatus == SubscriptionRequestStatus.APPROVED) {
                    Subscription sub = Subscription.builder()
                            .user(ghost).request(req)
                            .expireDate(LocalDate.now().plusDays(20))
                            .status(SubscriptionStatus.ACTIVE)
                            .build();
                    subscriptionRepository.save(sub);
                    saveTransaction(ghost, sub.getId(), "SUBSCRIPTION", "45.00", ZonedDateTime.now().minusDays(3 + i));
                }
            }
            log.info("Agent 1 processed history seeded.");
        }

        log.info("StatsSeeder completed.");
    }

    private Ticket saveTicket(User user, Trip trip, Station origin, Station dest, SeatClass sc, String price, ZonedDateTime date) {
        return ticketRepository.save(Ticket.builder()
                .user(user).trip(trip)
                .originStation(origin).destinationStation(dest)
                .seatClass(sc)
                .finalPrice(new BigDecimal(price))
                .createdAt(date)
                .build());
    }

    private void saveTransaction(User user, UUID targetId, String targetType, String amount, ZonedDateTime date) {
        transactionRepository.save(Transaction.builder()
                .user(user)
                .targetId(targetId)
                .targetType(targetType)
                .amount(new BigDecimal(amount))
                .type("PAYMENT")
                .pspTransactionId("SEED-" + UUID.randomUUID().toString().substring(0, 8))
                .status("SUCCESS")
                .createdAt(date)
                .build());
    }
}
