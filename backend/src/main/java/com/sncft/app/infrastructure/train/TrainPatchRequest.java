package com.sncft.app.infrastructure.train;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;


/**
 * Used for Train updates. Seat classes and capacities are physically locked
 * after creation — only the name and base price multiplier can be changed.
 */
public record TrainPatchRequest(
    @NotBlank(message = "Le nom du train est obligatoire")
    String name,

    @NotNull(message = "Le pourcentage d'augmentation du prix de base est obligatoire")
    @DecimalMin(value = "0.0", message = "Le pourcentage d'augmentation du prix de base ne peut pas être négatif")
    @DecimalMax(value = "100.0", message = "Le pourcentage d'augmentation du prix de base ne peut pas dépasser 100")
    BigDecimal basePriceIncreasePercentage
) {}
