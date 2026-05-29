package com.sncft.app.infrastructure.train;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "train_types")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Train {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    
    @Column(name = "base_price_increase_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal basePriceIncreasePercentage = BigDecimal.ZERO;

    @OneToMany(mappedBy = "train", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 3)
    @Builder.Default
    private List<SeatClass> seatClasses = new ArrayList<>();

    public void addSeatClass(SeatClass seatClass) {
        seatClasses.add(seatClass);
        seatClass.setTrain(this);
    }
}
