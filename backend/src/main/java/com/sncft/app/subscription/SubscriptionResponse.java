package com.sncft.app.subscription;

import lombok.Builder;

import java.time.LocalDate;
import java.util.UUID;

@Builder
public record SubscriptionResponse(
        UUID id,
        UUID requestId,
        String lineName,
        String categoryName,
        SubscriptionDuration duration,
        LocalDate expireDate,
        SubscriptionStatus status
) {}
