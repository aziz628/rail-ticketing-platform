package com.sncft.app.schedule;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "trip_schedule")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id", nullable = false)
    private Line line;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "train_id", nullable = false)
    private Train train;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "controller_id", nullable = false)
    private User controller;

    @Column(name = "days_bitmask", nullable = false)
    private String daysBitmask;

    @Column(name = "activation_date", nullable = false)
    private LocalDate activationDate;
    
    // default null for indefinetly active
    @Column(name = "deactivation_date")
    private LocalDate deactivationDate;

    @OneToMany(mappedBy = "tripSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    @OrderBy("arrivalTime ASC")
    @Builder.Default
    private List<TripStop> stops = new ArrayList<>();

    public void addStop(TripStop stop) {
        stops.add(stop);
        stop.setTripSchedule(this);
    }
}
