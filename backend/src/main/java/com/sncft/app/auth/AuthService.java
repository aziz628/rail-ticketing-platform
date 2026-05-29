package com.sncft.app.auth;

import jakarta.servlet.http.HttpServletRequest;
import com.sncft.app.shared.exception.DuplicateResourceException;
import com.sncft.app.shared.exception.InvalidCredentialsException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.shared.notification.EmailService;
import com.sncft.app.ticket.ClientRestriction;
import com.sncft.app.ticket.ClientRestrictionRepository;
import com.sncft.app.user.User;
import com.sncft.app.user.UserMapper;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import com.sncft.app.user.UserResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import com.sncft.app.auth.GovValidationService.GovIdentity;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final GovValidationService govValidationService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;
    private final ClientRestrictionRepository clientRestrictionRepository;

    public AuthService(UserRepository userRepository, UserMapper userMapper, 
                       PasswordEncoder passwordEncoder, GovValidationService govValidationService, 
                       AuthenticationManager authenticationManager, OtpService otpService, 
                       EmailService emailService, ClientRestrictionRepository clientRestrictionRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.govValidationService = govValidationService;
        this.authenticationManager = authenticationManager;
        this.otpService = otpService;
        this.emailService = emailService;
        this.clientRestrictionRepository = clientRestrictionRepository;
    }

    public UserResponse register(AuthRegisterRequest request) {
        GovIdentity identity = govValidationService.validateIdentity(request.nationalIdType().name(), request.nationalIdNumber());

        if (userRepository.existsByNationalIdNumber(request.nationalIdNumber())) {
            throw new DuplicateResourceException("L'identité nationale est déjà enregistrée");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("L'e-mail est déjà enregistré");
        }

        User user = User.builder()
     
                .name(identity.fullName())
                .nationalIdType(request.nationalIdType())
                .nationalIdNumber(request.nationalIdNumber())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(UserRole.VOYAGER)
                .isDeleted(false)
                .build();

        User savedUser = userRepository.save(user);

        // if the user is a voyager , save a client restriction record for him
        if (savedUser.getRole() == UserRole.VOYAGER) {
            clientRestrictionRepository.save(ClientRestriction.builder()
                .user(savedUser)
                .failedPaymentCount(0)
                .blocked(false)
                .build());
        }

        return userMapper.toResponse(savedUser);
    }

    public UserResponse login(AuthLoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Identifiants invalides"));

        if (user.getRole() != UserRole.VOYAGER) {
            throw new AccessDeniedException("Clients uniquement. Veuillez utiliser le portail du personnel.");
        }

        authenticate(request, httpRequest);
        return userMapper.toResponse(user);
    }

    public UserResponse staffLogin(AuthLoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Identifiants invalides"));

        if (user.getRole() == UserRole.VOYAGER) {
            throw new AccessDeniedException("Personnel uniquement. Veuillez utiliser le portail client.");
        }

        authenticate(request, httpRequest);
        return userMapper.toResponse(user);
    }

    /**
     * Authenticate user with given credentials and set the user's authentication (auth here means the user's identity ) in the security context 
     * which will persist for the duration of the HTTP session. 
     * 
     */
    private void authenticate(AuthLoginRequest request, HttpServletRequest httpRequest) {
        // checks the database for the user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        // set the user's authentication in the security context for the duration of the HTTP session
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // create session if the session does not exist and save the authentication  object in the HTTP session
        httpRequest.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext()
        );
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun utilisateur trouvé avec cet e-mail"));

        String otp = otpService.generateOtp(user.getEmail());
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Le nouveau mot de passe et la confirmation ne correspondent pas");
        }

        String email = otpService.getEmailByOtp(request.otp());
        if (email == null) {
            throw new IllegalArgumentException("OTP invalide ou expiré");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        otpService.clearOtp(request.otp());
    }
}
