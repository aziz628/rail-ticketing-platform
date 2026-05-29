package com.sncft.app.trip;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "trip_generation_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripGenerationSettings {

    @Id
    @Builder.Default
    private Integer id = 1;

    @Column(name = "auto_generate_enabled", nullable = false)
    @Builder.Default
    private boolean autoGenerateEnabled = true;

    @Column(name = "generation_span_days", nullable = false)
    @Builder.Default
    private int generationSpanDays = 7;
}
