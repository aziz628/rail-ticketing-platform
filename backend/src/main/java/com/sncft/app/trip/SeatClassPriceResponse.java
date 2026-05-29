package com.sncft.app.trip;

import java.math.BigDecimal;
import java.util.UUID;

public record SeatClassPriceResponse(
    UUID id,
    String type,
    BigDecimal distancePrice,
    BigDecimal basePrice,
    BigDecimal finalPrice,
    boolean available
) {}
