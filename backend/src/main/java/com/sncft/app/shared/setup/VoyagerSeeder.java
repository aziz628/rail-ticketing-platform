package com.sncft.app.shared.setup;

import com.sncft.app.ticket.ClientRestriction;
import com.sncft.app.ticket.ClientRestrictionRepository;
import com.sncft.app.user.NationalIdType;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
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

    @Override
    public void run(String... args) {
        // Main demo voyager
        if (!userRepository.existsByNationalIdNumber("87654321")) {
            User ahmed = User.builder()
                    .name("Ahmed Ben Salah")
                    .email("ahmed@sncft.tn")
                    .password(passwordEncoder.encode("12345678"))
                    .nationalIdType(NationalIdType.CIN)
                    .nationalIdNumber("87654321")
                    .role(UserRole.VOYAGER)
                    .isDeleted(false)
                    .build();
            User saved = userRepository.save(ahmed);
            clientRestrictionRepository.save(ClientRestriction.builder()
                    .user(saved).failedPaymentCount(0).blocked(false).build());
            log.info("Demo voyager seeded: Ahmed Ben Salah / ahmed@sncft.tn / 12345678");
        }

        // Blocked voyager (4 failed payments) — for the "get blocked" demo
        if (!userRepository.existsByNationalIdNumber("00004524")) {
            User blocked = User.builder()
                    .name("Riadh Chaabane")
                    .email("riadh@sncft.tn")
                    .password(passwordEncoder.encode("12345678"))
                    .nationalIdType(NationalIdType.CIN)
                    .nationalIdNumber("00004524")
                    .role(UserRole.VOYAGER)
                    .isDeleted(false)
                    .build();
            User savedBlocked = userRepository.save(blocked);
            clientRestrictionRepository.save(ClientRestriction.builder()
                    .user(savedBlocked).failedPaymentCount(4).blocked(false).build());
            log.info("Blocked voyager seeded: Riadh Chaabane");
        }

        // 10 ghost voyagers for stats
        String[] names = {
            "Sami Ben Ali", "Farouk Mansour", "Karim Trabelsi", "Bilel Gharbi", "Youssef Jlassi",
            "Montassar Ayari", "Omar Miled", "Nizar Khemiri", "Walid Jirbi", "Hichem Mathlouthi"
        };
        long voyagerCount = userRepository.countByRoleIn(List.of(UserRole.VOYAGER));
        if (voyagerCount < 12) {
            log.info("Seeding 10 fake voyagers for stats...");
            for (int i = 0; i < 10; i++) {
                // cin is a string of pure 8 digits , generate a random 7 numbers + i
                String cin = String.format("2019900%d", i);
                User voyager = User.builder()
                        .name(names[i])
                        .email(names[i].split(" ")[0].toLowerCase() + i + "@sncft.tn")
                        .password(passwordEncoder.encode("password"))
                        .nationalIdType(NationalIdType.CIN)
                        .nationalIdNumber(cin)
                        .role(UserRole.VOYAGER)
                        .isDeleted(false)
                        .build();
                User saved = userRepository.save(voyager);
                clientRestrictionRepository.save(ClientRestriction.builder()
                        .user(saved).failedPaymentCount(0).blocked(false).build());
            }
            log.info("10 fake voyagers seeded.");
        }
    }
}
