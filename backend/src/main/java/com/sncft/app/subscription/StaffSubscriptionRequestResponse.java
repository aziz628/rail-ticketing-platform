package com.sncft.app.subscription;

import java.time.LocalDate;
import java.util.UUID;

public record StaffSubscriptionRequestResponse(
    UUID id,
    String voyagerName,
    String lineName,
    SubscriptionCategoryType categoryName,
    SubscriptionDuration duration,
    SubscriptionRequestStatus status,
    String rejectReason,
    LocalDate createdAt
) {}
