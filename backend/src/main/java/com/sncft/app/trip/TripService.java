package com.sncft.app.trip;

import com.sncft.app.infrastructure.train.SeatClass;
import com.sncft.app.schedule.TripSchedule;
import com.sncft.app.schedule.TripScheduleRepository;
import com.sncft.app.schedule.TripStop;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.user.UserRepository;
import com.sncft.app.ticket.ClientRestrictionRepository;
import com.sncft.app.ticket.TicketRepository;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRole;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.shared.exception.DataConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.sncft.app.shared.config.AppConstants.*;

import com.sncft.app.subscription.Subscription;
import com.sncft.app.subscription.SubscriptionRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripService {

    private static final double PRICE_PER_KM = 0.05; // 0.05 TND per KM
    private static final int BOOKING_DEADLINE_MINUTES = 15;

    private final TripRepository tripRepository;
    private final TripScheduleRepository scheduleRepository;
    private final TripGenerationSettingsRepository settingsRepository;
    private final TripMapper tripMapper;
    private final UserRepository userRepository;
    private final ClientRestrictionRepository restrictionRepository;
    private final TicketRepository ticketRepository;
    private final StringRedisTemplate redisTemplate;
    private final SubscriptionRepository subscriptionRepository;

    /**
     * Daily cron at midnight — auto-generates trips if enabled in settings.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void scheduledSync() {
        TripGenerationSettings settings = getSettings();
        if (settings.isAutoGenerateEnabled()) {
            log.info("Daily sync triggered — span: {} days", settings.getGenerationSpanDays());
            syncUpcomingTrips(settings.getGenerationSpanDays());
        } else {
            log.info("Automatic trip generation is disabled.");
        }
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<TripSearchResponse> searchTrips(UUID originId, UUID destinationId, LocalDate date, Pageable pageable) {
        if (date.isBefore(LocalDate.now())) {
            throw new DataConflictException("La date de recherche ne peut pas être dans le passé");
        }

        Page<Trip> trips = tripRepository.searchTrips(originId, destinationId, date, pageable);

        List<TripSearchResponse> content = trips.getContent().stream().map(trip -> {
            // Find specific stops for origin and destination in the schedule
            Optional<TripStop> originStops = trip.getTripSchedule().getStops().stream()
                    .filter(s -> s.getLineNode().getId().equals(originId))
                    .findFirst();
            
            Optional<TripStop> destStops = trip.getTripSchedule().getStops().stream()
                    .filter(s -> s.getLineNode().getId().equals(destinationId))
                    .findFirst();

            if (originStops.isEmpty() || destStops.isEmpty()) {
                throw new ResourceNotFoundException("Gares de départ ou d'arrivée non trouvées dans ce voyage");
            }

            TripStop originStop = originStops.get();
            TripStop destStop = destStops.get();


            // Check if booking deadline has passed (15 mins before departure)
            boolean deadlineExpired = false;
            if (date.equals(LocalDate.now())) {
                LocalTime deadline = originStop.getArrivalTime().minusMinutes(BOOKING_DEADLINE_MINUTES);
                deadlineExpired = LocalTime.now().isAfter(deadline);
            } 

            // Check minimal available seats between origin and destination stops
            // segments interval is [originstop indexorder, deststop indexorder -1]
            int originIndexOrder = trip.getTripSchedule().getStops().indexOf(originStop);
            int destIndexOrder = trip.getTripSchedule().getStops().indexOf(destStop);
            
            // Check if any seat class has at least one seat available across all required segments
            // including active redis locks
            boolean anyClassAvailable = trip.getTripSchedule().getTrain().getSeatClasses().stream()
                    .anyMatch(sc -> isSeatClassAvailable(trip, sc.getId(), originIndexOrder, destIndexOrder));

            return tripMapper.toSearchResponse(
                    trip,
                    originStop.getLineNode().getStation().getName(),
                    destStop.getLineNode().getStation().getName(),
                    originStop.getArrivalTime(),
                    destStop.getArrivalTime(),
                    deadlineExpired,
                    anyClassAvailable
            );
        }).collect(Collectors.toList());

        return PaginatedResponse.of(trips, content);
    }

    // get paginated trips for a line and date
    public PaginatedResponse<TripResponse>getTrips( UUID lineId, LocalDate date, Pageable pageable){
        Page<Trip> page = tripRepository.findTrips(lineId, date, pageable);
        return new PaginatedResponse<>(
                page.getContent().stream().map(tripMapper::toResponse).toList(),
                page.isLast()
        );
    }

    public TripGenerationSettings getSettings() {
        return settingsRepository.getSettings()
                .orElseThrow(() -> new RuntimeException("Paramètre de génération des voyages non trouvé"));
    }

    @Transactional
    public void updateSettings(TripGenerationSettingsRequest request) {
        TripGenerationSettings current = getSettings();
        current.setAutoGenerateEnabled(request.autoGenerateEnabled());
        current.setGenerationSpanDays(request.generationSpanDays());
        settingsRepository.save(current);
    }

    /**
     * Core idempotent sync operation
     * runs in 3 DB queries regardless of schedules count.
     *
     * fetch all schedules whose window overlaps the span (with seat classes & stops via JOIN FETCH)
     * fetch all existing trip dates for those schedules in the span
     * saveAll() — one insert batch for all not yet generated trips
     */
    @Transactional
    public void syncUpcomingTrips(int spanDays) {
        // define span for for trip generation
        LocalDate spanStart = LocalDate.now();
        LocalDate spanEnd = spanStart.plusDays(spanDays);

        // fetch schedules relevant to this span
        List<TripSchedule> schedules = scheduleRepository.findSchedulesActiveInSpan(spanStart, spanEnd);
        if (schedules.isEmpty()) {
            log.info("No active schedules found in span [{}, {}]", spanStart, spanEnd);
            return;
        }

        // list of schedule IDs
        List<UUID> scheduleIds = schedules.stream().map(TripSchedule::getId).toList();

        // fetch all existing trip dates in span for a set of schedules existing
        Map<UUID, Set<LocalDate>> existingTripDatesMap = tripRepository
                .findExistingTripsDatesForScheduleIds(scheduleIds, spanStart, spanEnd)
                .stream()
                .collect(Collectors.groupingBy(
                        row -> (UUID) row[0],
                        Collectors.mapping(row -> (LocalDate) row[1], Collectors.toSet())
                ));

        // create list of all missing trips in memory
        List<Trip> newTrips = new ArrayList<>();
        
        // find missing trips for each schedule in the span and add them to newTrips list
        for (TripSchedule schedule : schedules) {
            Set<LocalDate> existingTripDates = existingTripDatesMap.getOrDefault(schedule.getId(), Set.of());
            collectMissingTrips(schedule, spanStart, spanEnd, existingTripDates, newTrips);
        }

        // single bulk insert
        if (!newTrips.isEmpty()) {
            tripRepository.saveAll(newTrips);
            log.info("Sync complete — {} trips generated for span [{}, {}]", newTrips.size(), spanStart, spanEnd);
        } else {
            log.info("Sync complete — no new trips needed for span [{}, {}]", spanStart, spanEnd);
        }
    }

    public BookingDetailsResponse getBookingDetails(UUID tripId, UUID originId, UUID destinationId) {
        
        Boolean userBlocked = isUserBlocked();

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Voyage non trouvé"));

        TripStop originStop = trip.getTripSchedule().getStops().stream()
                .filter(s -> s.getLineNode().getId().equals(originId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Gare de départ non trouvée dans ce trajet"));

        TripStop destStop = trip.getTripSchedule().getStops().stream()
                .filter(s -> s.getLineNode().getId().equals(destinationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Gare d'arrivée non trouvée dans ce trajet"));

        int originIndex = trip.getTripSchedule().getStops().indexOf(originStop);
        int destIndex = trip.getTripSchedule().getStops().indexOf(destStop);

        if (originIndex >= destIndex) {
            throw new DataConflictException("La gare de départ doit être avant la gare d'arrivée");
        }

        // Check deadline
        if (trip.getDate().equals(LocalDate.now())) {
            LocalTime deadline = originStop.getArrivalTime().minusMinutes(BOOKING_DEADLINE_MINUTES);
            if (LocalTime.now().isAfter(deadline)) {
                throw new DataConflictException("Le délai de réservation pour ce voyage est dépassé");
            }
        } else if (trip.getDate().isBefore(LocalDate.now())) {
            throw new DataConflictException("Ce voyage est déjà passé");
        }

        // Calculate distance
        double distance = destStop.getLineNode().getKmFromSource() - originStop.getLineNode().getKmFromSource();

        // distance price
        double distancePriceDouble = distance * PRICE_PER_KM;
        BigDecimal distancePrice = BigDecimal.valueOf(distancePriceDouble).setScale(2, RoundingMode.HALF_UP);

        // price percentage increase from train
        int trainPriceIncrease = trip.getTripSchedule().getTrain().getBasePriceIncreasePercentage().intValue();
        
        // base price for this trip (distance + train increase)
        BigDecimal basePrice = BigDecimal.valueOf(distancePriceDouble * (1 + trainPriceIncrease / 100.0))
                                         .setScale(2, RoundingMode.HALF_UP);

        // Map seat classes with prices
        List<SeatClassPriceResponse> seatClasses = trip.getTripSchedule().getTrain().getSeatClasses().stream()
                .map(sc -> {
                    // seat class price increase on top of base price
                    BigDecimal seatClassIncrease = BigDecimal.valueOf(
                        distancePriceDouble * (sc.getPriceIncreasePercentage().intValue() / 100.0)
                    );

                    // final price for this seat class
                    BigDecimal finalPrice = basePrice
                            .add(seatClassIncrease)
                            .setScale(2, RoundingMode.HALF_UP);
                    
                    // check availability for this class in all segments between origin and destination
                    boolean available = isSeatClassAvailable(trip, sc.getId(), originIndex, destIndex);

                    return new SeatClassPriceResponse(sc.getId(), sc.getType().name(), distancePrice, basePrice, finalPrice, available);
                })
                .toList();

        // Check if user already has a ticket for this trip and check active subscriptions
        Boolean isAlreadyBought = null;
        Boolean freeBookingAllowed = null;
        boolean isVoyager = false;


        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            Optional<User> userOpt = userRepository.findByEmail(auth.getName());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                isAlreadyBought = ticketRepository.existsByUserIdAndTripId(user.getId(), tripId);
                isVoyager = user.getRole() == UserRole.VOYAGER;

                // free booking if user have active sub at trip date
                UUID lineId = trip.getTripSchedule().getLine().getId();
                Optional<Subscription> subscription = subscriptionRepository.findActiveByUserIdAndLineId(user.getId(), lineId);
                freeBookingAllowed = subscription.isPresent() && (subscription.get().getExpireDate()==null || !trip.getDate().isAfter(subscription.get().getExpireDate()));
            }
        }

        // if user is not voyager, set isAlreadyBought and freeBookingAllowed to null to be removed from response
        if (!isVoyager) {
            isAlreadyBought = null;
            freeBookingAllowed = null;
        }

        return new BookingDetailsResponse(
                trip.getId(),
                originStop.getLineNode().getStation().getName(),
                destStop.getLineNode().getStation().getName(),
                originStop.getArrivalTime(),
                destStop.getArrivalTime(),
                trip.getDate(),
                trip.getTripSchedule().getTrain().getName(),
                isAlreadyBought,
                userBlocked,
                freeBookingAllowed,
                seatClasses
        );
    }

    /**
     * check if seat class available for all segments between origin and destination (included)
     * considering active redis locks
     */
    private boolean isSeatClassAvailable(Trip trip, UUID seatClassId, int originIndex, int destIndex) {
        
        return trip.getSegmentAvailabilities().stream()
                .filter(sa -> sa.getSeatClass().getId().equals(seatClassId))
                .filter(sa -> sa.getSegmentOrder() >= originIndex && sa.getSegmentOrder() < destIndex)
                .allMatch(sa -> {
                    // get this segment locks count from redis
                    String lockKey = String.format(SEGMENT_LOCK_KEY_PREFIX + "%s:%s:%d", 
                            trip.getId(), seatClassId, sa.getSegmentOrder());
                    String lockValue = redisTemplate.opsForValue().get(lockKey);
                    int activeLocks = (lockValue != null) ? Integer.parseInt(lockValue) : 0; // default to 0 if no lock
                     return (sa.getAvailableSeats() - activeLocks) > 0;
                });
    }

    /*
     * check if user is blocked
     */
    private Boolean isUserBlocked() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // if user is not authentibuildTripcated or is anonymous, pass the restriction check
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        
        return userRepository.findByEmail(auth.getName())
                .filter(user -> user.getRole() == UserRole.VOYAGER)
                .map(user -> restrictionRepository.findByUserIdAndBlockedTrue(user.getId()).isPresent())
                .orElse(null);
    }

    /**
     * Determines which dates are missing for a single schedule within the span
     * and appends the new Trip instances (with segments) to the shared list.
     */
    private void collectMissingTrips(TripSchedule schedule, LocalDate spanStart, LocalDate spanEnd,
            Set<LocalDate> existingDates, List<Trip> newTrips) {

        // redefine span to this schedule's own active window of activation and deactivation (need for edge of schedule's lifespan)
        LocalDate start = schedule.getActivationDate().isAfter(spanStart) ? schedule.getActivationDate() : spanStart;
        LocalDate end = (schedule.getDeactivationDate() != null && schedule.getDeactivationDate().isBefore(spanEnd))
                ? schedule.getDeactivationDate() : spanEnd;

        if (start.isAfter(end)) return;

        // for every enabled day of week create trip if not exists in date set
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            int dayIndex = date.getDayOfWeek().getValue() - 1; // Mon=0, Sun=6
            char bitmaskDayIndex = schedule.getDaysBitmask().charAt(dayIndex);
            
            if (bitmaskDayIndex == '1' && !existingDates.contains(date)) {
                newTrips.add(buildTrip(schedule, date));
            }
        }
    }

    /**
     * Builds a Trip instance and initializes segment availability of trip
     * for each seat class.
     */
    private Trip buildTrip(TripSchedule schedule, LocalDate date) {
        Trip trip = Trip.builder()
                .tripSchedule(schedule)
                .date(date)
                .build();

        // If we have n stops, then create n-1 segments
        int segmentCount = schedule.getStops().size() - 1;
        
        List<SeatClass> seatClasses = schedule.getTrain().getSeatClasses();

        // generate trip segment availability for each seat class with full capacity available
        for (int segment = 0; segment < segmentCount; segment++) {
            for (SeatClass seatClass : seatClasses) {
                trip.addSegmentAvailability(TripSegmentAvailability.builder()
                        .seatClass(seatClass)
                        .segmentOrder(segment)
                        .availableSeats(seatClass.getCapacity())
                        .build());
            }
        }

        return trip;
    }
}
