package com.sncft.app.subscription;

import java.time.ZonedDateTime;
import java.util.UUID;

public record SubscriptionRequestResponse(
    UUID id,
    String lineName,
    String categoryName,
    SubscriptionDuration duration,
    SubscriptionRequestStatus status,
    String rejectReason,
    ZonedDateTime createdAt
) {}
