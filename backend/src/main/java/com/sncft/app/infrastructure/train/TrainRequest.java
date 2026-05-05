package com.sncft.app.infrastructure.train;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/** Used for Train creation only. Seat classes are locked after creation. */
public record TrainRequest(
    @NotBlank(message = "Le nom du train est obligatoire")
    String name,

    @NotNull(message = "Le pourcentage d'augmentation du prix de base est obligatoire")
    @DecimalMin(value = "0.0", message = "Le pourcentage d'augmentation du prix de base ne peut pas être négatif")
    BigDecimal basePriceIncreasePercentage,

    @NotEmpty(message = "Au moins une classe de siège est requise")
    @Valid
    List<SeatClassRequest> seatClasses
) {}
