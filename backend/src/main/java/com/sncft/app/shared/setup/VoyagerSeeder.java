package com.sncft.app.shared.setup;

import com.sncft.app.ticket.ClientRestriction;
import com.sncft.app.ticket.ClientRestrictionRepository;
import com.sncft.app.user.NationalIdType;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

@Component
@Order(4)
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class VoyagerSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClientRestrictionRepository clientRestrictionRepository;

    // seed a voyager user in case it doesn't exist
    @Override
    public void run(String... args) {
        if (userRepository.existsByNationalIdNumber("87654321")) {
            log.info("Voyager user already exists. Skipping Voyager Seeder.");
            return;
        }
        User voyager = User.builder()
                .name("Noura Trabelsi")
                .email("Noura@gmail.com")
                .password(passwordEncoder.encode("12345678"))
                .nationalIdType(NationalIdType.CIN)
                .nationalIdNumber("87654321")
                .role(UserRole.VOYAGER)
                .isDeleted(false)
                .build();
                
        // save user
        User savedVoyager = userRepository.save(voyager);
        // save client restriction
        ClientRestriction clientRestriction = ClientRestriction.builder()
                .user(savedVoyager)
                .failedPaymentCount(0)
                .blocked(false)
                .build();
        clientRestrictionRepository.save(clientRestriction);

        log.info("Voyager user seeded: Noura Trabelsi / 87654321");
    }
}
