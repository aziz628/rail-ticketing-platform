package com.sncft.app.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // Clean database and save a real test user to H2
        userRepository.deleteAll();

        User testUser = User.builder()
                .email("test@example.com")
                .password(passwordEncoder.encode("oldPassword123"))
                .name("Test User")
                .role(UserRole.VOYAGER)
                .build();
        
        userRepository.save(testUser);
    }

    @Test
    void getMe_shouldReturnCurrentUser() throws Exception {
        // Uses real DB search
        mockMvc.perform(get("/users/me").with(user("test@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updatePassword_withValidRequest_shouldReturnOk() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest("oldPassword123", "newPassword123", "newPassword123");

        // Uses real UserService and real Repository save
        mockMvc.perform(patch("/users/me")
                .with(user("test@example.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated successfully"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updatePassword_withWrongOldPassword_shouldReturnUnauthorized() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest("wrongPassword", "newPassword123", "newPassword123");

        mockMvc.perform(patch("/users/me")
                .with(user("test@example.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updatePassword_withMismatchedNewPasswords_shouldReturnBadRequest() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest("oldPassword123", "newPassword123", "differentPassword");

        mockMvc.perform(patch("/users/me")
                .with(user("test@example.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
