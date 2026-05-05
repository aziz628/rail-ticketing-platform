package com.sncft.app.infrastructure;

import com.sncft.app.infrastructure.line.*;
import com.sncft.app.infrastructure.station.*;
import com.sncft.app.infrastructure.train.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InfrastructureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private TrainRepository trainRepository;

    @Autowired
    private LineRepository lineRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;
    private MockHttpSession voyagerSession;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        stationRepository.deleteAll();
        lineRepository.deleteAll();

        // Create Admin
        User admin = User.builder()
                .name("Admin")
                .email("admin@sncft.tn")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .build();
        userRepository.save(admin);

        // Create Voyager
        User voyager = User.builder()
                .name("Voyager")
                .email("voyager@gmail.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.VOYAGER)
                .build();
        userRepository.save(voyager);

        // Perform login to get sessions
        adminSession = (MockHttpSession) mockMvc.perform(post("/auth/staff/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@sncft.tn\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();

        voyagerSession = (MockHttpSession) mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"voyager@gmail.com\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }

    @Test
    void createStation_asAdmin_shouldSucceed() throws Exception {
        StationRequest request = new StationRequest("Tunis Ville");

        mockMvc.perform(post("/stations")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void createStation_asVoyager_shouldBeForbidden() throws Exception {
        StationRequest request = new StationRequest("Tunis Ville");

        mockMvc.perform(post("/stations")
                .session(voyagerSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createLine_withInvalidDistances_shouldFail() throws Exception {
        // Create stations first
        Station s1 = stationRepository.save(Station.builder().name("S1").build());
        Station s2 = stationRepository.save(Station.builder().name("S2").build());

        // Invalid: S2 distance is less than S1 (but first is 0 to pass DTO validation)
        LineRequest request = new LineRequest(
                "Invalid Line",
                List.of(
                        new LineNodeRequest(s1.getId(), 0.0),
                        new LineNodeRequest(s2.getId(), -5.0) // This will fail Min(0) or increasing check
                ),
                false
        );

        mockMvc.perform(post("/lines")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteStation_inUse_shouldReturnConflict() throws Exception {
        // Create a station and a line using it
        Station s1 = stationRepository.save(Station.builder().name("S1").build());
        Station s2 = stationRepository.save(Station.builder().name("S2").build());
        
        Line line = Line.builder().name("S1 - S2").build();
        line.addNode(LineNode.builder().station(s1).kmFromSource(0).orderIndex(0).build());
        line.addNode(LineNode.builder().station(s2).kmFromSource(10).orderIndex(1).build());
        lineRepository.save(line);

        // Try to delete s1
        mockMvc.perform(delete("/stations/" + s1.getId())
                .session(adminSession))
                .andExpect(status().isConflict());
    }

    @Test
    void createTrain_withSeatClasses_shouldSucceed() throws Exception {
        TrainRequest request = new TrainRequest(
                "Express GT",
                new BigDecimal("15.0"),
                List.of(
                        new SeatClassRequest(SeatClassType.SECOND, 100, new BigDecimal("0.0")),
                        new SeatClassRequest(SeatClassType.FIRST, 50, new BigDecimal("20.0"))
                )
        );

        mockMvc.perform(post("/trains")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void updateStation_shouldSucceed() throws Exception {
        Station station = stationRepository.save(Station.builder().name("Old Name").build());
        StationRequest request = new StationRequest("New Name");

        mockMvc.perform(put("/stations/" + station.getId())
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteStation_happyPath_shouldSucceed() throws Exception {
        Station station = stationRepository.save(Station.builder().name("To Delete").build());

        mockMvc.perform(delete("/stations/" + station.getId())
                .session(adminSession))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateTrain_partial_shouldSucceed() throws Exception {
        Train train = trainRepository.save(Train.builder()
                .name("Old Train")
                .basePriceIncreasePercentage(BigDecimal.ZERO)
                .build());
        
        TrainPatchRequest request = new TrainPatchRequest("New Train", new BigDecimal("5.0"));

        mockMvc.perform(patch("/trains/" + train.getId())
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateSeatClassPrice_shouldSucceed() throws Exception {
        Train train = Train.builder()
                .name("Price Test Train")
                .basePriceIncreasePercentage(BigDecimal.ZERO)
                .build();
        SeatClass sc = SeatClass.builder()
                .type(SeatClassType.SECOND)
                .capacity(100)
                .priceIncreasePercentage(BigDecimal.ZERO)
                .build();
        train.addSeatClass(sc);
        train = trainRepository.save(train);
        
        // Get the persisted seat class ID
        UUID seatClassId = train.getSeatClasses().get(0).getId();
        SeatClassPatchRequest request = new SeatClassPatchRequest(new BigDecimal("10.0"));

        mockMvc.perform(patch("/trains/" + train.getId() + "/seat-classes/" + seatClassId)
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }
}
