package com.sncft.app.staff;

import java.util.UUID;

public record AgentResponse(
        UUID id,
        String name,
        String email,
        boolean canDelete
) {
}
