package com.sncft.app.infrastructure.train;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SeatClassRequest(
    @NotNull(message = "Le type de classe de siège est obligatoire")
    SeatClassType type,

    @Min(value = 1, message = "La capacité doit être d'au moins 1")
    int capacity,
    
    @NotNull(message = "Le pourcentage d'augmentation du prix est obligatoire")
    @DecimalMin(value = "0.0", message = "Le pourcentage d'augmentation du prix ne peut pas être négatif")
    BigDecimal priceIncreasePercentage
) {}
