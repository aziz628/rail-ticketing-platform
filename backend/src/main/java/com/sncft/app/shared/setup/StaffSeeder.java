package com.sncft.app.shared.setup;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.staff.ControllerLine;
import com.sncft.app.staff.ControllerLineRepository;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@Order(3) 
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class StaffSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ControllerLineRepository controllerLineRepository;
    private final LineRepository lineRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        long staffCount = userRepository.countByRoleIn(List.of(UserRole.AGENT, UserRole.CONTROLEUR));
        if (staffCount > 0) {
            log.info("Staff users already exist. Skipping Staff Seeder.");
            return;
        }

        log.info("Running Staff Seeder...");

        // Create an Agent
        User agent = User.builder()
                .name("Agent Test")
                .email("agent@sncft.tn")
                .password(passwordEncoder.encode("agent123"))
                .role(UserRole.AGENT)
                .isDeleted(false)
                .build();
        userRepository.save(agent);
        log.info("Created Agent user: agent@sncft.tn");

        // Create a Controller 

        // find an active line
        Optional<Line> firstLineOpt = lineRepository.findAll().stream().findFirst();
        
        if (firstLineOpt.isPresent()) {
            User controller = User.builder()
                    .name("Controleur Test")
                    .email("controleur@sncft.tn")
                    .password(passwordEncoder.encode("controleur123"))
                    .role(UserRole.CONTROLEUR)
                    .isDeleted(false)
                    .build();
            userRepository.save(controller);
            log.info("Created Controleur user: controleur@sncft.tn");

            ControllerLine controllerLine = ControllerLine.builder()
                    .user(controller)
                    .line(firstLineOpt.get())
                    .build();
            controllerLineRepository.save(controllerLine);
            log.info("Assigned Controleur to Line: {}", firstLineOpt.get().getName());
        } else {
            log.warn("No lines found in the database. Cannot assign line to the controller. Skipping controller creation.");
        }

        log.info("Staff Seeder completed successfully.");
    }
}
