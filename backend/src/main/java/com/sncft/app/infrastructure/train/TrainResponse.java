package com.sncft.app.infrastructure.train;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TrainResponse(
    UUID id,
    String name,
    BigDecimal basePriceIncreasePercentage,
    List<SeatClassResponse> seatClasses,
    boolean canDelete
) {}
