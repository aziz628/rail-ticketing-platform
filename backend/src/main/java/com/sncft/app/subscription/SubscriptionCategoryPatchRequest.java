package com.sncft.app.subscription;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record SubscriptionCategoryPatchRequest(
    @NotNull(message = "Le prix mensuel est requis")
    @Positive(message = "Le prix mensuel doit être positif")
    BigDecimal monthlyPrice,

    @NotNull(message = "Le prix trimestriel est requis")
    @Positive(message = "Le prix trimestriel doit être positif")
    BigDecimal quarterlyPrice
) {}
