package com.sncft.app.shared.setup;

import com.sncft.app.infrastructure.train.SeatClass;
import com.sncft.app.infrastructure.train.SeatClassType;
import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(2) // After AdminSeeder
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class InfrastructureSeeder implements CommandLineRunner {

    private final StationRepository stationRepository;
    private final TrainRepository trainRepository;
    private final LineRepository lineRepository;

    @Override
    public void run(String... args) {
        if (stationRepository.count() == 0) {
            log.info("Seeding Tunisian stations...");
            List<String> stations = List.of(
                "Tunis Ville", "Sousse", "Sfax", "Gabes", 
                "Monastir", "Mahdia", "Bizerte", "Nabeul",
                "Kalaat Khasba", "Metlaoui", "Tozeur"
            );
            stations.forEach(name -> stationRepository.save(Station.builder().name(name).build()));
            log.info("Stations seeded successfully.");
        }

        if (trainRepository.count() == 0) {
            log.info("Seeding sample trains...");
            
            // Train Express (3 classes)
            Train express = Train.builder()
                .name("EXP")
                .basePriceIncreasePercentage(new BigDecimal("10.0"))
                .build();
            express.addSeatClass(createSeatClass(SeatClassType.SECOND, 120, "0.0"));
            express.addSeatClass(createSeatClass(SeatClassType.FIRST, 60, "20.0"));
            express.addSeatClass(createSeatClass(SeatClassType.COMFORT, 20, "50.0"));
            trainRepository.save(express);
            
            // Train Regional (2 classes)
            Train regional = Train.builder()
                .name("DC")
                .basePriceIncreasePercentage(BigDecimal.ZERO)
                .build();
            regional.addSeatClass(createSeatClass(SeatClassType.SECOND, 200, "0.0"));
            regional.addSeatClass(createSeatClass(SeatClassType.FIRST, 40, "15.0"));
            trainRepository.save(regional);

            log.info("Trains seeded successfully.");
        }

        if (lineRepository.count() == 0) {
            log.info("Seeding sample lines...");
            
            // Tunis Ville to Gabes via Sousse
            Line tunisGabes = Line.builder()
                    .name("Tunis-Gabes Express")
                    .build();

            Station tunis = stationRepository.findByNameIgnoreCase("Tunis Ville")
                    .orElseThrow(() -> new RuntimeException("Station 'Tunis Ville' not found"));
            Station sousse = stationRepository.findByNameIgnoreCase("Sousse")
                    .orElseThrow(() -> new RuntimeException("Station 'Sousse' not found"));
            Station gabes = stationRepository.findByNameIgnoreCase("Gabes")
                    .orElseThrow(() -> new RuntimeException("Station 'Gabes' not found"));

            tunisGabes.addNode(LineNode.builder().station(tunis).kmFromSource(0.0).orderIndex(0).build());
            tunisGabes.addNode(LineNode.builder().station(sousse).kmFromSource(140.0).orderIndex(1).build());
            tunisGabes.addNode(LineNode.builder().station(gabes).kmFromSource(300.0).orderIndex(2).build());
            
            lineRepository.save(tunisGabes);
            log.info("Lines seeded successfully.");
        }

    }

    

    private SeatClass createSeatClass(SeatClassType type, int capacity, String increase) {
        return SeatClass.builder()
                .type(type)
                .capacity(capacity)
                .priceIncreasePercentage(new BigDecimal(increase))
                .build();
    }
}
