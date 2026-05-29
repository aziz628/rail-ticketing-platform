package com.sncft.app.subscription;

import java.math.BigDecimal;
import java.util.UUID;

public record SubscriptionCategoryResponse(
    UUID id,
    SubscriptionCategoryType name,
    BigDecimal monthlyPrice,
    BigDecimal quarterlyPrice
) {}
