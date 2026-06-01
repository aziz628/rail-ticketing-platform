package com.sncft.app.shared.setup;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.infrastructure.train.SeatClass;
import com.sncft.app.infrastructure.train.SeatClassType;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class InfrastructureSeeder implements CommandLineRunner {

    private final StationRepository stationRepository;
    private final TrainRepository trainRepository;
    private final LineRepository lineRepository;

    @Override
    public void run(String... args) {
        seedStations();
        seedTrains();
        seedLines();
    }

    private void seedStations() {
        if (stationRepository.count() > 0) return;
        log.info("Seeding stations...");
        // Line 1 stations
        List.of("Tunis", "Bir Bou Regba", "Sousse", "Sfax", "Gabes", "Gafsa", "Metlaoui", "Tozeur",
                // Line 2 stations (ready to build in demo)
                "Gaafour", "Dahmani", "Le Kef", "Kalaa Khasba")
            .forEach(name -> stationRepository.save(Station.builder().name(name).build()));
        log.info("Stations seeded.");
    }

    private void seedTrains() {
        if (trainRepository.count() > 0) return;
        log.info("Seeding trains...");

        // Direct (10 seats) — the demo train that gets "almost full"
        Train direct = Train.builder()
                .name("Direct Climatisé")
                .basePriceIncreasePercentage(BigDecimal.ZERO)
                .build();
        direct.addSeatClass(createSeatClass(SeatClassType.SECOND, 10, "0.0"));
        trainRepository.save(direct);

        log.info("Train 'Direct Climatisé' (10 seats) seeded. Express created live in demo.");
    }

    private void seedLines() {
        if (lineRepository.count() > 0) return;
        log.info("Seeding Line 1: Tunis — Tozeur...");

        Line line1 = Line.builder().name("Tunis — Tozeur").build();

        String[] nodeNames = {"Tunis", "Bir Bou Regba", "Sousse", "Sfax", "Gabes", "Gafsa", "Metlaoui", "Tozeur"};
        double[] kms      = { 0.0, 65.0, 140.0, 270.0, 395.0, 470.0, 530.0, 570.0};

        for (int i = 0; i < nodeNames.length; i++) {
            final int idx = i;
            Station station = stationRepository.findByNameIgnoreCase(nodeNames[i])
                    .orElseThrow(() -> new RuntimeException("Station not found: " + nodeNames[idx]));
            line1.addNode(LineNode.builder()
                    .station(station).kmFromSource(kms[i]).orderIndex(i).build());
        }

        lineRepository.save(line1);
        log.info("Line 1 seeded. Line 2 built live in demo.");
    }

    private SeatClass createSeatClass(SeatClassType type, int capacity, String increase) {
        return SeatClass.builder()
                .type(type)
                .capacity(capacity)
                .priceIncreasePercentage(new BigDecimal(increase))
                .build();
    }
}
