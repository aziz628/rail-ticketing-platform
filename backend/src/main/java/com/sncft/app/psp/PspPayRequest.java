package com.sncft.app.psp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PspPayRequest(
    @NotNull UUID pspSessionId,
    @NotBlank String cardNumber,
    @NotBlank String cvv,
    @NotBlank String expiryDate
) {}
