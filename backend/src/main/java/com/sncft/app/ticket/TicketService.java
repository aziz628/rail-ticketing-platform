package com.sncft.app.ticket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.infrastructure.train.SeatClass;
import com.sncft.app.psp.PaymentInitiateResponse;
import com.sncft.app.psp.PspService;
import com.sncft.app.schedule.TripStop;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.trip.Trip;
import com.sncft.app.trip.TripRepository;
import com.sncft.app.trip.TripSegmentAvailability;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.sncft.app.shared.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;


import static com.sncft.app.shared.config.AppConstants.*;

import com.sncft.app.subscription.Subscription;
import com.sncft.app.subscription.SubscriptionRepository;
import com.sncft.app.subscription.SubscriptionStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TransactionRepository transactionRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final ClientRestrictionRepository restrictionRepository;
    private final PspService pspService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final TicketMapper ticketMapper;
    private final TicketPdfService ticketPdfService;
    private final SubscriptionRepository subscriptionRepository;

    public byte[] downloadTicket(UUID ticketId) {
        User user = getCurrentUser();
        // add date validation to download ticket
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Billet non trouvé"));
        
        // Prevent downloading expired tickets from previous days
        if (ticket.getTrip().getDate().isBefore(LocalDate.now())) {
            throw new DataConflictException("Ce billet est expiré et ne peut plus être téléchargé.");
        }
        
        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new DataConflictException("Vous n'êtes pas autorisé à télécharger ce billet");
        }

        TicketResponse response = ticketMapper.toResponse(ticket);
        return ticketPdfService.generateTicketPdf(response);
    }

    public PaginatedResponse<TicketResponse> getUpcomingTickets(Pageable pageable) {
        User user = getCurrentUser();
        Page<Ticket> page = ticketRepository.findAllByUserIdAndTrip_DateGreaterThanEqualOrderByTrip_DateAsc(user.getId(), LocalDate.now(), pageable);
        return PaginatedResponse.of(page, page.getContent().stream()
                .map(ticketMapper::toResponse)
                .collect(Collectors.toList()));
    }

    public PaginatedResponse<TicketResponse> getPastTickets(Pageable pageable) {
        User user = getCurrentUser();
        Page<Ticket> page = ticketRepository.findAllByUserIdAndTrip_DateLessThanOrderByTrip_DateDesc(user.getId(), LocalDate.now(), pageable);
        return PaginatedResponse.of(page, page.getContent().stream()
                .map(ticketMapper::toResponse)
                .collect(Collectors.toList()));
    }

    public PaginatedResponse<AdminBlockedUserResponse> getBlockedUsers(Pageable pageable) {
        Page<AdminBlockedUserResponse> page = restrictionRepository.findUsersWithBlocks(pageable);
        return PaginatedResponse.of(page, page.getContent());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @Transactional
    public PaymentInitiateResponse initiatePayment(TicketPaymentInitiateRequest request) {
        // Get and Validate User
        User user = getCurrentUser();

        checkUserRestrictions(user);

        // Fetch and Validate Trip
        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() -> new ResourceNotFoundException("Voyage non trouvé"));

        // Check for existing locks
        String userLockKey = USER_LOCK_KEY_PREFIX + user.getId();
        String existingSessionId = redisTemplate.opsForValue().get(userLockKey);

        // check if the session is of the selected trip
        if (existingSessionId != null) {
            // get context and check if the session is for the same trip
            String contextJson = redisTemplate.opsForValue().get(BOOKING_CONTEXT_KEY_PREFIX + existingSessionId);
            if (contextJson != null) {
                try {
                    Map<String, String> sessionData = objectMapper.readValue(contextJson, new TypeReference<Map<String, String>>() {});
                    UUID existingTripId = UUID.fromString(sessionData.get("tripId"));
                    if (existingTripId.equals(trip.getId())) {
                        // if the existing session is for the same trip, return the existing session id to avoid creating multiple sessions for the same trip
                        return new PaymentInitiateResponse(UUID.fromString(existingSessionId));
                    }else{
                        // if the existing session is for a different trip, then error of unallowed to buy multiple tickets for different trips at same time
                        throw new DataConflictException("vous ne pouvez pas acheter des billets pour plusieurs voyages en même temps.");
                    }
                } catch (JsonProcessingException e) {
                    log.error("Failed to parse existing session data", e);
                    // if failed to parse session data, proceed with creating a new session
                }
            }
        }


        /*  check if the selected trip is deleted (futur feature)
        if (trip.isDeleted()) {
            throw new DataConflictException("Ce voyage a été annulé.");
        }*/

        // check if already bought a ticket for this trip
        if (ticketRepository.existsByUserIdAndTripId(user.getId(), trip.getId())) {
            throw new DataConflictException("déjà acheté un billet pour ce voyage.");
        }

        // check if have active subscription for this trip line
        if (subscriptionRepository.existsByUserIdAndLineIdAndStatus(
            user.getId(), 
            trip.getTripSchedule().getLine().getId(), 
            SubscriptionStatus.ACTIVE)) {
            throw new DataConflictException("Vous avez déjà un abonnement actif.");
        }

        // Validate Stops and Order
        StopsInfo stopsInfo = getValidStops(trip, request.originLineNodeId(), request.destinationLineNodeId());
        
        // Check Deadlines
        if (trip.getDate().equals(LocalDate.now())) {
            if (LocalTime.now().isAfter(stopsInfo.originStop().getArrivalTime().minusMinutes(BOOKING_DEADLINE_MINUTES))) {
                throw new DataConflictException("Le délai de réservation pour ce voyage est dépassé.");
            }
        }else if (trip.getDate().isBefore(LocalDate.now())) {
            throw new DataConflictException("La date de ce voyage est déjà passée.");
        }

        // SeatClass and Availability
        SeatClass seatClass = trip.getTripSchedule().getTrain().getSeatClasses().stream()
                .filter(sc -> sc.getId().equals(request.seatClassId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Classe de siège non trouvée"));

        // check segments availability and get lock keys to be incremented
        List<String> segmentLockKeys = checkAvailability(trip, request.seatClassId(), stopsInfo.originIdx(), stopsInfo.destIdx());

        // Calculate Price
        BigDecimal price = calculatePrice(seatClass, trip, stopsInfo.originStop(), stopsInfo.destStop());

        // Request payment session from PSP
        UUID pspSessionId = pspService.createPaymentSession(price);

        // Persist this user booking Context and increment Segments Locks
        saveBookingContext(pspSessionId, user, trip, seatClass, stopsInfo, price, segmentLockKeys);
        
        // return the rest of time before session expiration, use the created session id
        return new PaymentInitiateResponse(pspSessionId);
    }

    @Transactional
    public TicketResponse bookFree(TicketPaymentInitiateRequest request) {
        // Get and Validate User
        User user = getCurrentUser();

        checkUserRestrictions(user);

        // Fetch and Validate Trip
        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() -> new ResourceNotFoundException("Voyage non trouvé"));

        if (trip.isDeleted()) {
            throw new DataConflictException("Ce voyage a été annulé.");
        }

        // check if already bought a ticket for this trip
        if (ticketRepository.existsByUserIdAndTripId(user.getId(), trip.getId())) {
            throw new DataConflictException("déjà acheté un billet pour ce voyage.");
        }

        // Validate Stops and Order
        StopsInfo stopsInfo = getValidStops(trip, request.originLineNodeId(), request.destinationLineNodeId());
        
        // Check Deadlines
        if (trip.getDate().equals(LocalDate.now())) {
            if (LocalTime.now().isAfter(stopsInfo.originStop().getArrivalTime().minusMinutes(BOOKING_DEADLINE_MINUTES))) {
                throw new DataConflictException("Le délai de réservation pour ce voyage est dépassé.");
            }
        } else if (trip.getDate().isBefore(LocalDate.now())) {
            throw new DataConflictException("La date de ce voyage est déjà passée.");
        }

        // Find active subscription for the line of this trip
        UUID lineId = trip.getTripSchedule().getLine().getId();
        Subscription subscription = subscriptionRepository.findActiveByUserIdAndLineId(user.getId(), lineId)
                .orElseThrow(() -> new DataConflictException("Aucun abonnement actif trouvé pour cette ligne."));

        // check if subscription is active when this trip happens
        if (subscription.getExpireDate() != null &&trip.getDate().isAfter(subscription.getExpireDate())) {
            throw new DataConflictException("Votre abonnement expirera avant la date de ce voyage.");
        }


        // check segments availability
        List<TripSegmentAvailability> segmentAvailabilities = trip.getSegmentAvailabilities().stream()
                .filter(sa -> sa.getSeatClass().getId().equals(request.seatClassId()) 
                && sa.getSegmentOrder() >= stopsInfo.originIdx() && sa.getSegmentOrder() < stopsInfo.destIdx())
                .collect(Collectors.toList());

        for (TripSegmentAvailability sa : segmentAvailabilities) {
            String lockKey = String.format(SEGMENT_LOCK_KEY_PREFIX + "%s:%s:%d", trip.getId(), request.seatClassId(), sa.getSegmentOrder());
            String lockValue = redisTemplate.opsForValue().get(lockKey);
            int activeLocks = (lockValue != null) ? Integer.parseInt(lockValue) : 0;

            if (sa.getAvailableSeats() - activeLocks <= 0) {
                throw new DataConflictException("places epuisées pour cette classe sur ce trajet.");
            }
        }

        // reduce one seat for each segment
        for (TripSegmentAvailability sa : segmentAvailabilities) {
            sa.setAvailableSeats(sa.getAvailableSeats() - 1);
        }




        Station origin = stationRepository.findById(stopsInfo.originStop().getLineNode().getStation().getId()).orElseThrow(
            () -> new ResourceNotFoundException("Gare de départ non trouvée")
        );
        Station dest = stationRepository.findById(stopsInfo.destStop().getLineNode().getStation().getId()).orElseThrow(
            () -> new ResourceNotFoundException("Gare d'arrivée non trouvée")
        );

        // Create Ticket
        Ticket ticket = Ticket.builder()
                .user(user)
                .trip(trip)
                .originStation(origin)
                .destinationStation(dest)
                .seatClass(SeatClass.builder().id(request.seatClassId()).build())
                .subscription(subscription)
                .finalPrice(BigDecimal.ZERO)
                .status(TicketStatus.PAID)
                .deleted(false)
                .build();
        ticketRepository.save(ticket);

        // Increment trip ticket count
        trip.setTicketCount(trip.getTicketCount() + 1);
        tripRepository.save(trip);

        return ticketMapper.toResponse(ticket);
    }

    /*
     * check if user is blocked
     */
    private void checkUserRestrictions(User user) {
        restrictionRepository.findByUserId(user.getId())
                .ifPresent(restriction -> {
                    if (restriction.isBlocked()) {
                        throw new DataConflictException("Votre compte est temporairement bloqué");
                    }
                }); 
    }

    private record StopsInfo(TripStop originStop, TripStop destStop, int originIdx, int destIdx) {}

    private StopsInfo getValidStops(Trip trip, UUID originId, UUID destId) {
        List<TripStop> stops = trip.getTripSchedule().getStops();
        TripStop originStop = null;
        TripStop destStop = null;
        int originIdx = -1;
        int destIdx = -1;

        for (int i = 0; i < stops.size(); i++) {
            TripStop stop = stops.get(i);
            if (stop.getLineNode().getId().equals(originId)) {
                originStop = stop;
                originIdx = i;
            } else if (stop.getLineNode().getId().equals(destId)) {
                destStop = stop;
                destIdx = i;
            }
        }

        if (originStop == null || destStop == null || originIdx >= destIdx) {
            throw new DataConflictException("station invalide pour ce voyage.");
        }
        return new StopsInfo(originStop, destStop, originIdx, destIdx);
    }

    private List<String>checkAvailability(Trip trip, UUID seatClassId, int originIdx, int destIdx) {
        
        // get all segment availabilities for the seat class
        List<TripSegmentAvailability> segmentAvailabilities = trip.getSegmentAvailabilities().stream()
                .filter(sa -> sa.getSeatClass().getId().equals(seatClassId) 
                && sa.getSegmentOrder() >= originIdx && sa.getSegmentOrder() < destIdx)
                .collect(Collectors.toList());

        // get all segment lock keys
        List<String> segmentLockKeys = segmentAvailabilities.stream()
                .map(sa -> String.format(SEGMENT_LOCK_KEY_PREFIX + "%s:%s:%d", trip.getId(), seatClassId, sa.getSegmentOrder()))
                .collect(Collectors.toList());

        // check if there are enough seats available 
        for (int i = 0; i < segmentAvailabilities.size(); i++) {
            TripSegmentAvailability sa = segmentAvailabilities.get(i);
            String segLockKey = segmentLockKeys.get(i);
            String lockValue = redisTemplate.opsForValue().get(segLockKey);
            int activeLocks = (lockValue != null) ? Integer.parseInt(lockValue) : 0; // if segment lock count don't exist default it to 0

            if (sa.getAvailableSeats() - activeLocks <= 0) {
                throw new DataConflictException("places epuisées pour cette classe sur ce trajet.");
            }
        }   
        return segmentLockKeys;
    }

    private BigDecimal calculatePrice(SeatClass seatClass, Trip trip, TripStop origin, TripStop dest) {
        double distance = dest.getLineNode().getKmFromSource() - origin.getLineNode().getKmFromSource();
        // base price = distance * price per km
        double basePrice = distance * PRICE_PER_KM;
        // apply increases for seat class and train
        BigDecimal trainIncrease = trip.getTripSchedule().getTrain().getBasePriceIncreasePercentage();
        
        BigDecimal seatClassIncrease = seatClass.getPriceIncreasePercentage();
        return BigDecimal.valueOf(basePrice)
                .multiply(BigDecimal.ONE
                    .add(seatClassIncrease
                        .add(trainIncrease)
                        .divide(BigDecimal.valueOf(100))
                    )
                );
        
    }

    /*
     */
    private void saveBookingContext(UUID pspSessionId, User user, Trip trip, SeatClass seatClass, 
                                   StopsInfo stops, BigDecimal price, List<String> segmentLockKeys) {
        Map<String, String> bookingContext = new HashMap<>();
        bookingContext.put("tripId", trip.getId().toString());
        bookingContext.put("userId", user.getId().toString());
        bookingContext.put("originStationId", stops.originStop().getLineNode().getStation().getId().toString());
        bookingContext.put("destinationStationId", stops.destStop().getLineNode().getStation().getId().toString());
        bookingContext.put("seatClassId", seatClass.getId().toString());
        bookingContext.put("amount", price.toString());
        bookingContext.put("originIdx", String.valueOf(stops.originIdx()));
        bookingContext.put("destIdx", String.valueOf(stops.destIdx()));

        try {
            // Main session key (expires in 10m)
            String contextJson = objectMapper.writeValueAsString(bookingContext);
            redisTemplate.opsForValue().set(BOOKING_CONTEXT_KEY_PREFIX + pspSessionId, contextJson, LOCK_DURATION);
            
            // Shadow key (expires in 10m + 10s) - used for timeout cleanup
            redisTemplate.opsForValue().set(SHADOW_SESSION_KEY_PREFIX + pspSessionId, contextJson, LOCK_DURATION.plusSeconds(10));
            redisTemplate.opsForValue().set(USER_LOCK_KEY_PREFIX + user.getId(), pspSessionId.toString(), LOCK_DURATION);
            
            // increase the number of seats locks for each segment

            for (String segKey : segmentLockKeys) {

                // check if the key value don't exist
                if(redisTemplate.opsForValue().get(segKey) == null) {
                    // calculate segment locks TTL: trip date + end of day
                    long ttlSeconds = Duration.between(
                        LocalDateTime.now(), 
                        trip.getDate().atTime(23, 59)
                    ).getSeconds();
                    
                    redisTemplate.opsForValue().set(segKey, "0", Duration.ofSeconds(ttlSeconds));
                }
                // increment seat lock by 1
                redisTemplate.opsForValue().increment(segKey);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to store booking context", e);
            throw new RuntimeException("Échec de l'initialisation de la session de réservation");
        }
    }


    @Transactional
    public void finalizePayment(UUID pspSessionId, String pspTransactionId) {
        String contextJson = redisTemplate.opsForValue().get(BOOKING_CONTEXT_KEY_PREFIX + pspSessionId);
        if (contextJson == null) throw new ResourceNotFoundException("Session expirée");

        Map<String, String> sessionData;
        try {
            sessionData = objectMapper.readValue(contextJson, new TypeReference<Map<String, String>>() {}); 
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erreur de lecture de la session");
        }

        UUID userId = UUID.fromString(sessionData.get("userId"));
        UUID tripId = UUID.fromString(sessionData.get("tripId"));
        UUID seatClassId = UUID.fromString(sessionData.get("seatClassId"));
        UUID originId = UUID.fromString(sessionData.get("originStationId"));
        UUID destId = UUID.fromString(sessionData.get("destinationStationId"));
        BigDecimal amount = new BigDecimal(sessionData.get("amount"));
        int originIdx = Integer.parseInt(sessionData.get("originIdx"));
        int destIdx = Integer.parseInt(sessionData.get("destIdx"));

        User user = userRepository.findById(userId).orElseThrow(
            () -> new ResourceNotFoundException("Utilisateur non trouvé")
        );
        Trip trip = tripRepository.findById(tripId).orElseThrow(
            () -> new ResourceNotFoundException("Voyage non trouvé")
        );

        // prevent race condition for duplicate finalization before making the booking
        if (ticketRepository.existsByUserIdAndTripId(userId, tripId)) {
            throw new DataConflictException("déjà acheté un billet pour ce voyage.");
        }
        Station origin = stationRepository.findById(originId).orElseThrow();
        Station dest = stationRepository.findById(destId).orElseThrow();

        // Create Ticket
        Ticket ticket = Ticket.builder()
                .user(user)
                .trip(trip)
                .originStation(origin)
                .destinationStation(dest)
                .seatClass(SeatClass.builder().id(seatClassId).build())
                .finalPrice(amount)
                .status(TicketStatus.PAID)
                .deleted(false)
                .build();
        ticketRepository.save(ticket);

        // find segment availabilities of this partial trip and seat class
        List<TripSegmentAvailability> segmentAvailabilities = trip.getSegmentAvailabilities().stream()
                .filter(sa -> sa.getSeatClass().getId().equals(seatClassId) 
                && sa.getSegmentOrder() >= originIdx && sa.getSegmentOrder() < destIdx)
                .collect(Collectors.toList());

        // reduce one seat for each segment
        for (TripSegmentAvailability sa : segmentAvailabilities) {
            sa.setAvailableSeats(sa.getAvailableSeats() - 1);
        }

        // Increment trip ticket count
        trip.setTicketCount(trip.getTicketCount() + 1);
        tripRepository.save(trip);

 

        // Create Transaction
        Transaction transaction = Transaction.builder()
                .user(user)
                .targetId(ticket.getId())
                .targetType(TRANSACTION_TARGET_TICKET)
                .amount(amount)
                .type(TRANSACTION_TYPE_PAYMENT)
                .pspTransactionId(pspTransactionId)
                .status(TRANSACTION_STATUS_SUCCESS)
                .build();
        transactionRepository.save(transaction);

        // Cleanup Locks
        cleanupLocks(pspSessionId, userId, tripId, seatClassId, originIdx, destIdx);
    }

    private void cleanupLocks(UUID pspSessionId, UUID userId, UUID tripId, UUID seatClassId, int originIdx, int destIdx) {
        // remove user lock, booking context, and shadow key
        redisTemplate.delete(USER_LOCK_KEY_PREFIX + userId);
        redisTemplate.delete(BOOKING_CONTEXT_KEY_PREFIX + pspSessionId);
        redisTemplate.delete(SHADOW_SESSION_KEY_PREFIX + pspSessionId);

        // decrement segment locks
        for (int i = originIdx; i < destIdx; i++) {
            String segKey = String.format(SEGMENT_LOCK_KEY_PREFIX + "%s:%s:%d", tripId, seatClassId, i);
            redisTemplate.opsForValue().decrement(segKey);
        }
    }

    @Transactional
    public void handlePaymentFailure(UUID pspSessionId) {
        // get booking context from redis (try main then shadow fallback)
        String contextJson = redisTemplate.opsForValue().get(BOOKING_CONTEXT_KEY_PREFIX + pspSessionId);
        // if main session context not found, try shadow session context (in case of payment failure after main session expired )
        if (contextJson == null) {
            contextJson = redisTemplate.opsForValue().get(SHADOW_SESSION_KEY_PREFIX + pspSessionId);
            if (contextJson == null) return;
        }

        try {
            Map<String, String> sessionData = objectMapper.readValue(contextJson, new TypeReference<Map<String, String>>() {});
            UUID userId = UUID.fromString(sessionData.get("userId"));
            
            // update user restriction
            restrictionRepository.findByUserId(userId)
                .ifPresent(restriction -> {
                    restriction.setFailedPaymentCount(restriction.getFailedPaymentCount() + 1);
                    // block user after 5 failed payments
                    if (restriction.getFailedPaymentCount() >= 5) {
                        if (!restriction.isBlocked()) {
                            restriction.setBlocked(true);
                            restriction.setTotalLifetimeBlocks(restriction.getTotalLifetimeBlocks() + 1);
                        }
                    }
                    restrictionRepository.save(restriction);
                });
            
            // delete booking context and release ticket lock
            cleanupLocks(pspSessionId, userId, 
                UUID.fromString(sessionData.get("tripId")), 
                UUID.fromString(sessionData.get("seatClassId")),
                Integer.parseInt(sessionData.get("originIdx")),
                Integer.parseInt(sessionData.get("destIdx")));

        } catch (JsonProcessingException e) {
            log.error("Failed to parse session data during failure handling", e);
        }
    }

    /**
     * Reset all restrictions daily at midnight
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetAllRestrictionsDaily() {
        log.info("Resetting all client restrictions daily at midnight...");
        restrictionRepository.resetAllRestrictions();
        log.info("All client restrictions have been reset successfully.");
    }
}
