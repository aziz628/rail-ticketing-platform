package com.sncft.app.schedule;

import com.fasterxml.jackson.databind.ObjectMapper;
// serializing java.time objects with the Jackson core library
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.infrastructure.line.LineNodeRepository;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import com.sncft.app.staff.ControllerLine;
import com.sncft.app.staff.ControllerLineRepository;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TripScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LineRepository lineRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private LineNodeRepository lineNodeRepository;

    @Autowired
    private TrainRepository trainRepository;

    @Autowired
    private TripScheduleRepository scheduleRepository;

    @Autowired
    private ControllerLineRepository controllerLineRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;

    
    private Line testLine;
    private Train testTrain;
    private User controller;
    private LineNode node1;
    private LineNode node2;

    @BeforeEach
    void setUp() throws Exception {
        // extend default object mapper for serializing java.time objects with the Jackson core library
        objectMapper.registerModule(new JavaTimeModule());
        
        // Clean up database before each test
        scheduleRepository.deleteAll();
        controllerLineRepository.deleteAll();
        lineNodeRepository.deleteAll();
        lineRepository.deleteAll();
        stationRepository.deleteAll();
        trainRepository.deleteAll();
        userRepository.deleteAll();

        // Create Admin
        User admin = User.builder()
                .name("Admin")
                .email("admin@sncft.tn")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .isDeleted(false)
                .build();
        userRepository.save(admin);

        // Create Voyager
        User voyager = User.builder()
                .name("Voyager")
                .email("voyager@gmail.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.VOYAGER)
                .isDeleted(false)
                .build();
        userRepository.save(voyager);

        // Create Controller
        controller = User.builder()
                .name("Controller")
                .email("controller@sncft.tn")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.CONTROLLER)
                .isDeleted(false)
                .build();
        userRepository.save(controller);

        // Infrastructure
        testLine = Line.builder().name("Tunis - Sousse").build();
        lineRepository.save(testLine);

        Station s1 = Station.builder().name("Tunis").build();
        Station s2 = Station.builder().name("Sousse").build();
        stationRepository.saveAll(List.of(s1, s2));

        // create line nodes
        node1 = LineNode.builder().line(testLine).station(s1).kmFromSource(0).orderIndex(0).build();
        node2 = LineNode.builder().line(testLine).station(s2).kmFromSource(140).orderIndex(1).build();
        lineNodeRepository.saveAll(List.of(node1, node2));
        
        // add line nodes to line
        testLine.setNodes(List.of(node1, node2)); // Ensure bi-directional link for service validation

        testTrain = Train.builder().name("Express 1").basePriceIncreasePercentage(BigDecimal.TEN).build();
        trainRepository.save(testTrain);

        ControllerLine cl = ControllerLine.builder().user(controller).line(testLine).build();
        controllerLineRepository.save(cl);

        // Login sessions
        adminSession = (MockHttpSession) mockMvc.perform(post("/auth/staff/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@sncft.tn\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"voyager@gmail.com\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        controllerLineRepository.deleteAll();
        lineNodeRepository.deleteAll();
        lineRepository.deleteAll();
        stationRepository.deleteAll();
        trainRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createSchedule_withValidData_shouldSucceed() throws Exception {
        ScheduleCreateRequest request = new ScheduleCreateRequest(
                testLine.getId(),
                testTrain.getId(),
                controller.getId(),
                "1111111",
                LocalDate.now().plusDays(1),
                null,
                List.of(
                        new ScheduleCreateRequest.ScheduleStopRequest(node1.getId(), LocalTime.of(8, 0)),
                        new ScheduleCreateRequest.ScheduleStopRequest(node2.getId(), LocalTime.of(10, 30))
                )
        );

        mockMvc.perform(post("/schedules")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        
        // verify that the schedule is created
        assertEquals(1, scheduleRepository.count());
    }

    @Test
    void createSchedule_withInvalidStopOrder_shouldReturnBadRequest() throws Exception {
        ScheduleCreateRequest request = new ScheduleCreateRequest(
                testLine.getId(),
                testTrain.getId(),
                controller.getId(),
                "1111111",
                LocalDate.now().plusDays(1),
                null,
                List.of(
                        new ScheduleCreateRequest.ScheduleStopRequest(node1.getId(), LocalTime.of(10, 0)),
                        new ScheduleCreateRequest.ScheduleStopRequest(node2.getId(), LocalTime.of(8, 30)) // Earlier than first stop
                )
        );

        mockMvc.perform(post("/schedules")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSchedule_withInvalidDateRange_shouldReturnBadRequest() throws Exception {
        ScheduleCreateRequest request = new ScheduleCreateRequest(
                testLine.getId(),
                testTrain.getId(),
                controller.getId(),
                "1111111",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(5), // Before activation
                List.of(
                        new ScheduleCreateRequest.ScheduleStopRequest(node1.getId(), LocalTime.of(8, 0)),
                        new ScheduleCreateRequest.ScheduleStopRequest(node2.getId(), LocalTime.of(10, 30))
                )
        );

        mockMvc.perform(post("/schedules")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getActiveSchedules_shouldReturnOnlyActive() throws Exception {
        // Active schedule
        TripSchedule active = TripSchedule.builder()
                .line(testLine).train(testTrain).controller(controller)
                .daysBitmask("1111111").activationDate(LocalDate.now().minusDays(1))
                .build();
        scheduleRepository.save(active);

        // Inactive schedule
        TripSchedule inactive = TripSchedule.builder()
                .line(testLine).train(testTrain).controller(controller)
                .daysBitmask("1111111").activationDate(LocalDate.now().minusDays(10))
                .deactivationDate(LocalDate.now().minusDays(1))
                .build();
        scheduleRepository.save(inactive);

        mockMvc.perform(get("/schedules/ACTIVE").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id", is(active.getId().toString())));
    }

    @Test
    void deactivateSchedule_asAdmin_shouldSucceed() throws Exception {
        TripSchedule active = TripSchedule.builder()
                .line(testLine).train(testTrain).controller(controller)
                .daysBitmask("1111111").activationDate(LocalDate.now())
                .build();
        scheduleRepository.save(active);

        DeactivateScheduleRequest deactivationrequest = new DeactivateScheduleRequest(LocalDate.now().plusDays(7));
// localdate default value gonna be for example  : 2025-05-06  
        mockMvc.perform(patch("/schedules/" + active.getId() + "/deactivate")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(deactivationrequest)))
                .andExpect(status().isNoContent()); 

        TripSchedule updated = scheduleRepository.findById(active.getId()).orElseThrow();
        assertEquals(updated.getDeactivationDate(), LocalDate.now().plusDays(7));
    }
}
