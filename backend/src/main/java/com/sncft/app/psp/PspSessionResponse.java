package com.sncft.app.psp;

import java.math.BigDecimal;
import java.util.UUID;

public record PspSessionResponse(
    UUID pspSessionId,
    BigDecimal amount,
    long remainingTimeinSecondes
) {}
