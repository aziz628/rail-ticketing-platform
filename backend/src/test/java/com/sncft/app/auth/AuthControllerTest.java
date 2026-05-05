package com.sncft.app.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.shared.notification.EmailService;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private GovValidationService govValidationService;

    @MockitoBean
    private OtpService otpService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        // clean database before each test
        userRepository.deleteAll();

        // mock gov validation service to return a specific id identity for testing
        Mockito.when(
                govValidationService.validateIdentity(
                        ArgumentMatchers.anyString(), // match any string for the param
                        ArgumentMatchers.anyString()))
                .thenReturn(new GovValidationService.GovIdentity("12345678", "CIN", "Mourad Ben Ali"));
    }

    // --- REGISTRATION TESTS ---

    @Test
    void register_withValidData_shouldReturnCreated() throws Exception {
        AuthRegisterRequest request = new AuthRegisterRequest("CIN", "12345678", "test@example.com", "password123");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Mourad Ben Ali"));
    }

    @Test
    void register_withDuplicateEmail_shouldReturnConflict() throws Exception {
        register_withValidData_shouldReturnCreated();
        AuthRegisterRequest request = new AuthRegisterRequest("CIN", "87654321", "test@example.com", "password123");

        // send request and check if it returns 409 (Conflict)
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    // --- LOGIN TESTS ---

    @Test
    void login_withCorrectCredentials_shouldReturnOk() throws Exception {
        register_withValidData_shouldReturnCreated();
        AuthLoginRequest loginRequest = new AuthLoginRequest("test@example.com", "password123");

        // send request and check if user info is returned
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void login_withWrongPassword_shouldReturnUnauthorized() throws Exception {
        register_withValidData_shouldReturnCreated();
        AuthLoginRequest loginRequest = new AuthLoginRequest("test@example.com", "wrongpassword");

        // send request and check if it returns 401 (Unauthorized)
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    // --- STAFF LOGIN TESTS ---

    @Test
    void staffLogin_withAdminUser_shouldReturnOk() throws Exception {
        // Create an admin user manually since register() only creates VOYAGERS
        User admin = User.builder()
                .name("Admin User")
                .email("admin@sncft.com")
                .password(passwordEncoder.encode("adminPass"))
                .role(UserRole.ADMIN)
                .nationalIdType(null)
                .nationalIdNumber(null)
                .isDeleted(false)
                .build();
        userRepository.save(admin);

        AuthLoginRequest loginRequest = new AuthLoginRequest("admin@sncft.com", "adminPass");

        mockMvc.perform(post("/auth/staff/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void staffLogin_withVoyagerUser_shouldReturnForbidden() throws Exception {
        register_withValidData_shouldReturnCreated(); // creates "test@example.com" with VOYAGER role
        AuthLoginRequest loginRequest = new AuthLoginRequest("test@example.com", "password123");

        mockMvc.perform(post("/auth/staff/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_withAdminUser_shouldReturnForbidden() throws Exception {
        // Create admin
        User admin = User.builder()
                .name("Admin User")
                .email("admin@sncft.com")
                .password(passwordEncoder.encode("adminPass"))
                .role(UserRole.ADMIN)
                .nationalIdType(null)
                .nationalIdNumber(null)
                .isDeleted(false)
                .build();
        userRepository.save(admin);

        AuthLoginRequest loginRequest = new AuthLoginRequest("admin@sncft.com", "adminPass");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());
    }

    // --- LOGOUT TESTS ---

    @Test
    void logout_withAuthenticatedUser_shouldReturnOk() throws Exception {
        register_withValidData_shouldReturnCreated();
        AuthLoginRequest loginRequest = new AuthLoginRequest("test@example.com", "password123");

        // extract cookie from login response
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        // extract session from login request instead of cookie because mockmvc doesn't show sessionid in response header cookie
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession();

        // send request with the authenticated session
        mockMvc.perform(post("/auth/logout")
                .session(session))
                .andExpect(status().isOk());
    }

    // --- FORGOT PASSWORD TESTS ---

    @Test
    void forgotPassword_withValidEmail_shouldReturnOk() throws Exception {
        register_withValidData_shouldReturnCreated();
        ForgotPasswordRequest request = new ForgotPasswordRequest("test@example.com");

        Mockito.when(otpService.generateOtp("test@example.com")).thenReturn("12345678");

        mockMvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        Mockito.verify(emailService).sendOtpEmail("test@example.com", "12345678");
    }

    @Test
    void forgotPassword_withUnknownEmail_shouldReturnNotFound() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("unknown@example.com");

        mockMvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // --- RESET PASSWORD TESTS ---

    @Test
    void resetPassword_withValidOtp_shouldReturnOk() throws Exception {
        register_withValidData_shouldReturnCreated();
        ResetPasswordRequest request = new ResetPasswordRequest("12345678", "newPassword123", "newPassword123");

        Mockito.when(otpService.getEmailByOtp("12345678")).thenReturn("test@example.com");

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_withInvalidOtp_shouldReturnBadRequest() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("00000000", "newPassword123", "newPassword123");

        Mockito.when(otpService.getEmailByOtp("00000000")).thenReturn(null);

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPassword_withMismatchedPasswords_shouldReturnBadRequest() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("12345678", "newPassword123", "differentPassword");

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
