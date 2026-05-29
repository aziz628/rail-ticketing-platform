package com.sncft.app.subscription;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.auth.AuthLoginRequest;
import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.psp.PaymentTargetType;
import com.sncft.app.psp.PspPayRequest;
import com.sncft.app.shared.notification.EmailService;
import com.sncft.app.ticket.ClientRestrictionRepository;
import com.sncft.app.ticket.TransactionRepository;
import com.sncft.app.ticket.TicketRepository;
import com.sncft.app.staff.ControllerLineRepository;
import com.sncft.app.trip.TripRepository;
import com.sncft.app.schedule.TripScheduleRepository;
import com.sncft.app.user.NationalIdType;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SubscriptionIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private UserRepository userRepository;
    @Autowired private LineRepository lineRepository;
    @Autowired private SubscriptionCategoryRepository categoryRepository;
    @Autowired private SubscriptionRequestRepository requestRepository;
    @Autowired private SubscriptionRepository subscriptionRepository;
    @Autowired private ClientRestrictionRepository restrictionRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private ControllerLineRepository controllerLineRepository;
    @Autowired private TripRepository tripRepository;
    @Autowired private TripScheduleRepository scheduleRepository;

    @MockitoBean private StringRedisTemplate redisTemplate;
    @MockitoBean private ValueOperations<String, String> valueOperations;
    @MockitoBean private RedisConnectionFactory redisConnectionFactory;
    @MockitoBean private ReactiveRedisConnectionFactory reactiveRedisConnectionFactory;
    @MockitoBean private RedisMessageListenerContainer redisMessageListenerContainer;
    @MockitoBean private EmailService emailService;

    private User voyager;
    private Line line;

    @BeforeEach
    void setUp() {
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        ticketRepository.deleteAll();
        subscriptionRepository.deleteAll();
        requestRepository.deleteAll();
        transactionRepository.deleteAll();
        restrictionRepository.deleteAll();
        tripRepository.deleteAll();
        scheduleRepository.deleteAll();
        controllerLineRepository.deleteAll();
        userRepository.deleteAll();
        lineRepository.deleteAll();
        
        userRepository.flush();

        if (categoryRepository.count() == 0) {
            categoryRepository.save(SubscriptionCategory.builder()
                    .name(SubscriptionCategoryType.PROFESSIONNEL)
                    .monthlyPrice(BigDecimal.valueOf(50))
                    .quarterlyPrice(BigDecimal.valueOf(135))
                    .build());
        } else {
            categoryRepository.findAll().stream()
                    .filter(c -> c.getName() == SubscriptionCategoryType.PROFESSIONNEL)
                    .findFirst()
                    .orElseThrow();
        }

        voyager = userRepository.save(User.builder()
                .name("Voyager Test")
                .email("voyager@test.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.VOYAGER)
                .nationalIdType(NationalIdType.CIN)
                .nationalIdNumber("12345678")
                .isDeleted(false)
                .build());

        userRepository.save(User.builder()
                .name("Agent Test")
                .email("agent@test.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.AGENT)
                .isDeleted(false)
                .build());

        line = lineRepository.save(Line.builder().name("Tunis-Sousse").build());
    }

    @Test
    void fullSubscriptionFlow_ShouldSucceed() throws Exception {
        // Login Voyager
        AuthLoginRequest vLogin = new AuthLoginRequest("voyager@test.com", "password");
        MvcResult vResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(vLogin)))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession vSession = (MockHttpSession) vResult.getRequest().getSession();

        // Voyager gets categories
        mockMvc.perform(get("/subscription-categories").session(vSession))
                .andExpect(status().isOk());

        // Voyager creates subscription request (multipart/form-data)
        MockMultipartFile mockedProofFile = new MockMultipartFile("proofFile", "test.pdf", "application/pdf", "dummy pdf content".getBytes());
        mockMvc.perform(multipart("/subscription-requests")
                .file(mockedProofFile)
                .param("categoryName", SubscriptionCategoryType.PROFESSIONNEL.name())
                .param("lineId", line.getId().toString())
                .param("duration", SubscriptionDuration.MONTHLY.name())
                .session(vSession))
                .andExpect(status().isCreated());

        // Login Agent
        AuthLoginRequest aLogin = new AuthLoginRequest("agent@test.com", "password");
        MvcResult aResult = mockMvc.perform(post("/auth/staff/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(aLogin)))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession aSession = (MockHttpSession) aResult.getRequest().getSession();

        // Agent gets pending requests
        MvcResult pendingResult = mockMvc.perform(get("/staff/subscription-requests/PENDING").session(aSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].voyagerName").value("Voyager Test"))
                .andReturn();

        // get id from response
        String pendingJson = pendingResult.getResponse().getContentAsString();
        String requestIdStr = objectMapper.readTree(pendingJson).get("content").get(0).get("id").asText();
        UUID requestId = UUID.fromString(requestIdStr);

        // Agent approves request
        mockMvc.perform(patch("/staff/subscription-requests/" + requestId + "/approve")
                .session(aSession))
                .andExpect(status().isNoContent());

        // mock voyager's current subscriptions
        MvcResult subsResult = mockMvc.perform(get("/subscriptions/"+SubscriptionFilter.CURRENT.name()).session(vSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value(SubscriptionStatus.AWAITING_PAYMENT.name()))
                .andReturn();
        
        // get subscription id from response
        String subsJson = subsResult.getResponse().getContentAsString();
        String subIdStr = objectMapper.readTree(subsJson).get("content").get(0).get("id").asText();
        UUID subId = UUID.fromString(subIdStr);

        // mock voyager initiates payment
        MvcResult initResult = mockMvc.perform(post("/subscriptions/" + subId + "/initiate-payment")
                .session(vSession))
                .andExpect(status().isOk())
                .andReturn();

        // get payment session id from response
        String initJson = initResult.getResponse().getContentAsString();
        String pspSessionIdStr = objectMapper.readTree(initJson).get("pspSessionId").asText();
        UUID pspSessionId = UUID.fromString(pspSessionIdStr);

        // Mock Redis for PSP payment
        Map<String, String> bookingCtx = new HashMap<>();
        bookingCtx.put("requestId", requestId.toString());
        bookingCtx.put("subscriptionId", subId.toString());
        bookingCtx.put("userId", voyager.getId().toString());
        bookingCtx.put("amount", "50.00");

        // mock redis getters
        Mockito.when(valueOperations.get("subscription:session:" + pspSessionId))
                .thenReturn(objectMapper.writeValueAsString(bookingCtx));
        
        Mockito.when(valueOperations.get("psp:session:" + pspSessionId))
                .thenReturn("50.00");

        // perform payment
        PspPayRequest payRequest = new PspPayRequest(pspSessionId, "3712 3456 7890 1234", "123", "12/28");
        mockMvc.perform(post("/mock-psp/pay/"+PaymentTargetType.SUBSCRIPTION.name())
                .session(vSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payRequest)))
                .andExpect(status().isOk());

        // Voyager verifies subscription is ACTIVE
        mockMvc.perform(get("/subscriptions/"+SubscriptionFilter.CURRENT.name()).session(vSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.content[0].expireDate").exists());
    }
}
