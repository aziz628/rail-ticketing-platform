package com.sncft.app.infrastructure.train;

import java.math.BigDecimal;
import java.util.UUID;

public record SeatClassResponse(
    UUID id,
    SeatClassType type,
    int capacity,
    BigDecimal priceIncreasePercentage
) {}
