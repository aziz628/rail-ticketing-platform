package com.sncft.app.psp;

import java.util.UUID;

public record PaymentInitiateResponse(
    UUID pspSessionId
) {}
