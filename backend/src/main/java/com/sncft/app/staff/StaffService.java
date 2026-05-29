package com.sncft.app.staff;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.DuplicateResourceException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.sncft.app.shared.notification.EmailService;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserRepository userRepository;
    private final ControllerLineRepository controllerLineRepository;
    private final LineRepository lineRepository;
    private final StaffMapper staffMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // all alphabet and numbers used in generating the password
    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String NUMBER = "0123456789";
    private static final String DATA_FOR_RANDOM_STRING = CHAR_LOWER + CHAR_UPPER + NUMBER;

    // SecureRandom for secure unpredictable random number
    private static final SecureRandom random = new SecureRandom();
    private static final int PASSWORD_LENGTH=10;

    // generate password with given length
    public static String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);

        // select chars randomly from the string 
        for (int i = 0; i < length; i++) {
            int rndCharAt = random.nextInt(DATA_FOR_RANDOM_STRING.length());
            char rndChar = DATA_FOR_RANDOM_STRING.charAt(rndCharAt);
            sb.append(rndChar);
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AgentResponse> getAgents(int page, int size) {
        // get active agents
        Page<User> userPage = userRepository.findByRoleInAndIsDeletedFalse(
                List.of(UserRole.AGENT),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        // canDelete only when there is more than one active agent
        long totalAgents = userRepository.countByRoleAndIsDeletedFalse(UserRole.AGENT);
        boolean canDelete = totalAgents > 1;

        List<AgentResponse> responses = userPage.getContent().stream()
                .map(u -> staffMapper.toAgentResponse(u, canDelete))
                .collect(Collectors.toList());

        return PaginatedResponse.of(userPage, responses);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ControllerResponse> getControllers(int page, int size) {
        Page<ControllerLine> controllerPage = controllerLineRepository.findAllActiveWithUserAndLine(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "user.createdAt"))
        );

        List<UUID> controllerIds = controllerPage.getContent().stream()
                .map(cl -> cl.getUser().getId())
                .collect(Collectors.toList());
        
        List<UUID> nonDeletableIds = userRepository.findControllersWithActiveSchedules(controllerIds);

        List<ControllerResponse> responses = controllerPage.getContent().stream()
                .map(cl -> staffMapper.toControllerResponse(cl.getUser(), cl.getLine().getName(), !nonDeletableIds.contains(cl.getUser().getId())))
                .collect(Collectors.toList());

        return PaginatedResponse.of(controllerPage, responses);
    }

    @Transactional
    public void createAgent(CreateAgentRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("L'e-mail est déjà enregistré");
        }

        String generatedPassword = generateRandomPassword(PASSWORD_LENGTH);

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .role(UserRole.AGENT)
                .password(passwordEncoder.encode(generatedPassword))
                .isDeleted(false)
                .build();

        userRepository.save(user);
        emailService.sendStaffWelcomeEmail(user.getEmail(), user.getName(), generatedPassword);
    }

    @Transactional
    public void createController(CreateControllerRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("L'e-mail est déjà enregistré");
        }

        Line line = lineRepository.findById(request.lineId())
                .orElseThrow(() -> new ResourceNotFoundException("Ligne non trouvée"));

        String generatedPassword = generateRandomPassword(PASSWORD_LENGTH);

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .role(UserRole.CONTROLLER)
                .password(passwordEncoder.encode(generatedPassword))
                .isDeleted(false)
                .build();

        userRepository.save(user);

        ControllerLine controllerLine = ControllerLine.builder()
                .user(user)
                .line(line)
                .build();
        controllerLineRepository.save(controllerLine);

        emailService.sendStaffWelcomeEmail(user.getEmail(), user.getName(), generatedPassword);
    }

    @Transactional
    public void deactivateStaff(UUID id) {
        User user = userRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel non trouvé"));

        if (user.getRole() != UserRole.AGENT && user.getRole() != UserRole.CONTROLLER) {
            throw new IllegalArgumentException("Impossible de désactiver cet utilisateur");
        }
        // if controller has an active schedule, throw exception
        if (user.getRole() == UserRole.CONTROLLER) {
            List<UUID> nonDeletable = userRepository.findControllersWithActiveSchedules(List.of(id));
            if (!nonDeletable.isEmpty()) {
                throw new DataConflictException("contrôleur assigné à un horaire actif");
            }
        } 
        // if agent is last agent, throw exception
        if (user.getRole() == UserRole.AGENT) {
            long count = userRepository.countByRoleAndIsDeletedFalse(UserRole.AGENT);
            if (count == 1) {
                throw new DataConflictException("Impossible de désactiver le dernier agent");
            }
        }

        user.setDeleted(true);
        userRepository.save(user);
    }
}
