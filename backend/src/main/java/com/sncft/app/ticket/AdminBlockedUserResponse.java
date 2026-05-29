package com.sncft.app.ticket;

import java.util.UUID;

public record AdminBlockedUserResponse(
    UUID userId,
    String username,
    int totalLifetimeBlocks
) {}
