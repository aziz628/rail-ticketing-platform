package com.sncft.app.infrastructure.train;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SeatClassPatchRequest(
    @NotNull(message = "Le pourcentage d'augmentation du prix est obligatoire")
    @DecimalMin(value = "0.0", message = "Le pourcentage d'augmentation du prix ne peut pas être négatif")
    BigDecimal priceIncreasePercentage
) {}
