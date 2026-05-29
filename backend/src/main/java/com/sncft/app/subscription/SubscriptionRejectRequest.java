package com.sncft.app.subscription;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubscriptionRejectRequest(
    @NotBlank(message = "Le motif du rejet est requis")
    @Size(max = 255, message = "Le motif ne peut pas dépasser 255 caractères")
    String rejectReason
) {}
