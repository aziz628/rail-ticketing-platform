package com.sncft.app.ticket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.auth.AuthLoginRequest;
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
import com.sncft.app.psp.PaymentTargetType;
import com.sncft.app.psp.PspPayRequest;
import com.sncft.app.schedule.TripSchedule;
import com.sncft.app.schedule.TripScheduleRepository;
import com.sncft.app.schedule.TripStop;
import com.sncft.app.shared.notification.EmailService;
import com.sncft.app.subscription.Subscription;
import com.sncft.app.subscription.SubscriptionCategory;
import com.sncft.app.subscription.SubscriptionCategoryType;
import com.sncft.app.subscription.SubscriptionDuration;
import com.sncft.app.subscription.SubscriptionRequest;
import com.sncft.app.subscription.SubscriptionRequestStatus;
import com.sncft.app.subscription.SubscriptionStatus;
import com.sncft.app.trip.Trip;
import com.sncft.app.trip.TripRepository;
import com.sncft.app.trip.TripSegmentAvailability;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath; // do a JSON path check on the response body and verify it matches the expected value
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TicketingIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private UserRepository userRepository;
    @Autowired private StationRepository stationRepository;
    @Autowired private LineRepository lineRepository;
    @Autowired private LineNodeRepository lineNodeRepository;
    @Autowired private TrainRepository trainRepository;
    @Autowired private TripScheduleRepository scheduleRepository;
    @Autowired private TripRepository tripRepository;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private ClientRestrictionRepository restrictionRepository;
    @Autowired private com.sncft.app.subscription.SubscriptionRepository subscriptionRepository;
    @Autowired private com.sncft.app.subscription.SubscriptionRequestRepository subscriptionRequestRepository;
    @Autowired private com.sncft.app.subscription.SubscriptionCategoryRepository subscriptionCategoryRepository;

    // Mock Redis so the app context starts without a live Redis instance
    @MockitoBean private StringRedisTemplate redisTemplate;
    @MockitoBean private ValueOperations<String, String> valueOperations;
    @MockitoBean private RedisConnectionFactory redisConnectionFactory;
    @MockitoBean private ReactiveRedisConnectionFactory reactiveRedisConnectionFactory;
    @MockitoBean private RedisMessageListenerContainer redisMessageListenerContainer;
    @MockitoBean private EmailService emailService;

    private User voyager;
    private Trip savedTrip;
    private Station tunis;
    private Station sousse;
    private SeatClass firstClass;
    private LineNode n1;
    private LineNode n2;

    @BeforeEach
    void setUp() {
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        ticketRepository.deleteAll();
        subscriptionRepository.deleteAll();
        subscriptionRequestRepository.deleteAll();
        subscriptionCategoryRepository.deleteAll();
        tripRepository.deleteAll();
        scheduleRepository.deleteAll();
        lineNodeRepository.deleteAll();
        lineRepository.deleteAll();
        restrictionRepository.deleteAll();
        stationRepository.deleteAll();
        trainRepository.deleteAll();
        userRepository.deleteAll();

        // User
        voyager = userRepository.save(User.builder()
                .name("Voyager Test")
                .email("voyager@test.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.VOYAGER)
                .isDeleted(false)
                .build());

        // Stations
        tunis  = stationRepository.save(Station.builder().name("Tunis").build());
        sousse = stationRepository.save(Station.builder().name("Sousse").build());

        // Train + SeatClass
        Train train = Train.builder().name("Express").basePriceIncreasePercentage(BigDecimal.ZERO).build();
        firstClass = SeatClass.builder().type(SeatClassType.FIRST).capacity(50)
                .priceIncreasePercentage(BigDecimal.TEN).train(train).build();
        train.setSeatClasses(new ArrayList<>(List.of(firstClass)));
        trainRepository.save(train);

        // Line + Nodes
        Line line = lineRepository.save(Line.builder().name("Tunis-Sousse").build());
        n1 = lineNodeRepository.save(LineNode.builder().line(line).station(tunis).orderIndex(0).kmFromSource(0).build());
        n2 = lineNodeRepository.save(LineNode.builder().line(line).station(sousse).orderIndex(1).kmFromSource(140).build());

        // Schedule
        TripSchedule schedule = scheduleRepository.save(TripSchedule.builder()
                .line(line).train(train).controller(voyager)
                .daysBitmask("1111111")
                .activationDate(LocalDate.now())
                .deactivationDate(LocalDate.now().plusDays(30))
                .build());

        // Trip - set to tomorrow to avoid same-day booking deadline issues
        savedTrip = tripRepository.save(Trip.builder()
                .tripSchedule(schedule)
                .date(LocalDate.now().plusDays(1))
                .deleted(false)
                .build());

        // Segment availability
        TripSegmentAvailability segment = TripSegmentAvailability.builder()
                .trip(savedTrip).seatClass(firstClass).segmentOrder(0).availableSeats(50).build();
        savedTrip.setSegmentAvailabilities(new ArrayList<>(List.of(segment)));
        tripRepository.save(savedTrip);

        // Stops , departure at 23:59 so the 15-min booking deadline never triggers
        schedule.setStops(new ArrayList<>(List.of(
            TripStop.builder().lineNode(n1).arrivalTime(LocalTime.of(23, 59)).tripSchedule(schedule).build(),
            TripStop.builder().lineNode(n2).arrivalTime(LocalTime.of(23, 59)).tripSchedule(schedule).build()
        )));
        scheduleRepository.save(schedule);
    }

   

    @Test
    void fullTicketingFlow_ShouldSucceed() throws Exception {
        AuthLoginRequest request = new AuthLoginRequest("voyager@test.com", "password");

        //login
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        
        //get session from login result for user that has authenticated
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession();

        // Search trips 
        mockMvc.perform(get("/trips/search")
                .param("originId", n1.getId().toString())
                .param("destinationId", n2.getId().toString())
                // set date to tommorrow to avoid same-day booking cutoff issues in case the test runs late in the day
                .param("date",  LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].tripId").value(savedTrip.getId().toString()));

        // Booking details 
        mockMvc.perform(get("/trips/" + savedTrip.getId() + "/booking-details")
                .param("originId", n1.getId().toString())
                .param("destinationId", n2.getId().toString())
                .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(savedTrip.getId().toString()))
                .andExpect(jsonPath("$.isAlreadyBought").value(false));

        // Initiate payment as VOYAGER 
        TicketPaymentInitiateRequest initRequest = new TicketPaymentInitiateRequest(
                savedTrip.getId(), n1.getId(), n2.getId(), firstClass.getId());
        
        //initiate payment and get pspSessionId 
        MvcResult initResult = mockMvc.perform(post("/tickets/initiate-payment")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(initRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pspSessionId").exists())
                .andReturn();

        //Extract pspSessionId from initResult 
        UUID pspSessionId = UUID.fromString(
                objectMapper.readTree(initResult.getResponse().getContentAsString())
                        .get("pspSessionId").asText());

        //mock booking context for success payment 
        Map<String, String> bookingCtx = new HashMap<>();
        bookingCtx.put("tripId",savedTrip.getId().toString());
        bookingCtx.put("userId",voyager.getId().toString());
        bookingCtx.put("originStationId",tunis.getId().toString());
        bookingCtx.put("destinationStationId",sousse.getId().toString());
        bookingCtx.put("seatClassId",firstClass.getId().toString());
        bookingCtx.put("amount","7.70");
        bookingCtx.put("originIdx","0");
        bookingCtx.put("destIdx","1");
        bookingCtx.put("attempts","0");

        // return the mocked booking context when called by ticket finalizePayment via booking session key 
        Mockito.when(valueOperations.get("booking:session:" + pspSessionId))
                .thenReturn(objectMapper.writeValueAsString(bookingCtx));
        
        // return the mocked psp session amount when called by ticket finalizePayment via psp session key 
        Mockito.when(valueOperations.get("psp:session:" + pspSessionId))
                .thenReturn("7.70");

        // Card from mocked psp-cards 
        PspPayRequest payRequest = new PspPayRequest(pspSessionId, "3712 3456 7890 1234", "123", "12/28");
        
        // do successful payment 
        mockMvc.perform(post("/mock-psp/pay/"+PaymentTargetType.TICKET.name())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payRequest)))
                .andExpect(status().isOk());

        // Verify Ticket Exists using API endpoint and extract the ID
        MvcResult ticketsResult = mockMvc.perform(get("/tickets/UPCOMING").session(session))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].status").value("PAID"))
                .andReturn();

        // Extract ticket ID from the API response
        String ticketsJson = ticketsResult.getResponse().getContentAsString();
        String ticketIdStr = objectMapper.readTree(ticketsJson).get("content").get(0).get("id").asText();
        UUID ticketId = UUID.fromString(ticketIdStr);

        // Ticket Download using the real endpoint
        mockMvc.perform(get("/tickets/" + ticketId + "/download").session(session))
                .andExpect(status().isOk());
    }

    @Test
    void freeTicketingFlow_ShouldSucceed() throws Exception {
        AuthLoginRequest loginRequest = new AuthLoginRequest("voyager@test.com", "password");

        // login
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();
        
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession();

        // Seed active subscription for the voyager on Tunis-Sousse line
        SubscriptionCategory category = subscriptionCategoryRepository.save(
                SubscriptionCategory.builder()
                        .name(SubscriptionCategoryType.CIVIL)
                        .monthlyPrice(BigDecimal.valueOf(20))
                        .quarterlyPrice(BigDecimal.valueOf(50))
                        .build()
        );

        SubscriptionRequest subRequest = subscriptionRequestRepository.save(
                SubscriptionRequest.builder()
                        .user(voyager)
                        .category(category)
                        .line(savedTrip.getTripSchedule().getLine())
                        .duration(SubscriptionDuration.MONTHLY)
                        .status(SubscriptionRequestStatus.APPROVED)
                        .build()
        );

        subscriptionRepository.save(
                Subscription.builder()
                        .user(voyager)
                        .request(subRequest)
                        .status(SubscriptionStatus.ACTIVE)
                        .expireDate(LocalDate.now().plusMonths(1))
                        .build()
        );

        // Fetch booking details and verify freeBookingAllowed is true
        mockMvc.perform(get("/trips/" + savedTrip.getId() + "/booking-details")
                .param("originId", n1.getId().toString())
                .param("destinationId", n2.getId().toString())
                .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(savedTrip.getId().toString()))
                .andExpect(jsonPath("$.freeBookingAllowed").value(true));

        // Perform direct free booking via book-free endpoint
        TicketPaymentInitiateRequest freeBookRequest = new TicketPaymentInitiateRequest(
                savedTrip.getId(), n1.getId(), n2.getId(), firstClass.getId());

        MvcResult freeBookResult = mockMvc.perform(post("/tickets/book-free")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(freeBookRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.price").value(0.00))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andReturn();

        // Extract ticket ID
        String ticketJson = freeBookResult.getResponse().getContentAsString();
        String ticketIdStr = objectMapper.readTree(ticketJson).get("id").asText();

        // Verify in upcoming list that ticket is linked to active subscription
        mockMvc.perform(get("/tickets/UPCOMING").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(ticketIdStr))
                .andExpect(jsonPath("$.content[0].price").value(0.0));
    }
}
