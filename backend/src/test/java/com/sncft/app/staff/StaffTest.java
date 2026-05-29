package com.sncft.app.staff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.shared.notification.EmailService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StaffTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LineRepository lineRepository;

    @Autowired
    private ControllerLineRepository controllerLineRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailService emailService;

    private MockHttpSession adminSession;
    private MockHttpSession voyagerSession;
    private Line testLine;

    @BeforeEach
    void setUp() throws Exception {
        // Delete in in FK-safe order,  child tables first
        controllerLineRepository.deleteAll();
        userRepository.deleteAll();
        lineRepository.deleteAll();

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

        // Create a Line 
        testLine = Line.builder()
                .name("Tunis - Sousse")
                .build();
        lineRepository.save(testLine);

        // Login sessions
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

    @AfterEach
    void tearDown() {
        // Clean up in FK-safe order after each test
        controllerLineRepository.deleteAll();
        userRepository.deleteAll();
        lineRepository.deleteAll();
    }

    //  GET AGENTS 

    @Test
    void getAgents_asAdmin_shouldReturnPaginatedList() throws Exception {
        // Save an agent with all required fields
        User agent = User.builder()
                .name("Agent 1")
                .email("agent1@sncft.tn")
                .password(passwordEncoder.encode("pass"))
                .role(UserRole.AGENT)
                .isDeleted(false)
                .build();
        userRepository.save(agent);

        mockMvc.perform(get("/staff/agents").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Agent 1")))
                .andExpect(jsonPath("$.content[0].email", is("agent1@sncft.tn")));
    }

    @Test
    void getAgents_asVoyager_shouldBeForbidden() throws Exception {
        mockMvc.perform(get("/staff/agents").session(voyagerSession))
                .andExpect(status().isForbidden());
    }

    //  GET CONTROLLERS 

    @Test
    void getControllers_asAdmin_shouldReturnPaginatedList() throws Exception {
        // Save controller with all required fields
        User controller = User.builder()
                .name("Controller 1")
                .email("controller1@sncft.tn")
                .password(passwordEncoder.encode("pass"))
                .role(UserRole.CONTROLLER)
                .isDeleted(false)
                .build();
        userRepository.save(controller);

        // ControllerLine PK is derived from user via @MapsId — no separate ID needed
        ControllerLine cl = ControllerLine.builder()
                .user(controller)
                .line(testLine)
                .build();
        controllerLineRepository.save(cl);

        mockMvc.perform(get("/staff/controllers").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Controller 1")))
                .andExpect(jsonPath("$.content[0].assignedLineName", is("Tunis - Sousse")));
    }

    //  CREATE AGENT 

    @Test
    void createAgent_asAdmin_shouldSucceed() throws Exception {
        CreateAgentRequest request = new CreateAgentRequest("New Agent", "newagent@sncft.tn");

        mockMvc.perform(post("/staff/agents")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        assert userRepository.existsByEmailIgnoreCase("newagent@sncft.tn");
    }

    @Test
    void createAgent_withDuplicateEmail_shouldReturnConflict() throws Exception {
        // Pre-save a user with the same email
        User existing = User.builder()
                .name("Existing")
                .email("duplicate@sncft.tn")
                .password(passwordEncoder.encode("pass"))
                .role(UserRole.AGENT)
                .isDeleted(false)
                .build();
        userRepository.save(existing);

        CreateAgentRequest request = new CreateAgentRequest("Another Agent", "duplicate@sncft.tn");

        mockMvc.perform(post("/staff/agents")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    // CREATE CONTROLLER
    @Test
    void createController_asAdmin_shouldSucceed() throws Exception {
        CreateControllerRequest request = new CreateControllerRequest(
                "New Controller",
                "newcontroller@sncft.tn",
                testLine.getId()
        );

        mockMvc.perform(post("/staff/controllers")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        assert userRepository.existsByEmailIgnoreCase("newcontroller@sncft.tn");
    }

    @Test
    void createController_withNonExistentLine_shouldReturnNotFound() throws Exception {
        CreateControllerRequest request = new CreateControllerRequest(
                "Ghost Controller",
                "ghost@sncft.tn",
                UUID.randomUUID() // random UUID that doesn't exist
        );

        mockMvc.perform(post("/staff/controllers")
                .session(adminSession)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    //  DEACTIVATE 
    @Test
    void deactivateAgent_asAdmin_shouldSoftDelete() throws Exception {
        User agent = User.builder()
                .name("agent1")
                .email("agent1@sncft.tn")
                .password(passwordEncoder.encode("pass"))
                .role(UserRole.AGENT)
                .isDeleted(false)
                .build();
        userRepository.save(agent);

        // Deactivate the agent and expect 409 "Impossible de désactiver le dernier agent"
        mockMvc.perform(delete("/staff/agents/" + agent.getId())
                .session(adminSession))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Impossible de désactiver le dernier agent")));

        // add another agent
        User agent2 = User.builder()
                .name("Agent 2")
                .email("agent2@sncft.tn")
                .password(passwordEncoder.encode("pass"))
                .role(UserRole.AGENT)
                .isDeleted(false)
                .build();
        userRepository.save(agent2);

        // Deactivate the agent and expect 200 
        mockMvc.perform(delete("/staff/agents/" + agent.getId())
                .session(adminSession))
                .andExpect(status().isOk());

        User updated = userRepository.findById(agent.getId()).orElseThrow();
        assert updated.isDeleted();
    }
}
