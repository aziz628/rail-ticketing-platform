package com.sncft.app.staff;

import java.util.UUID;

public record ControllerResponse(
    UUID id,
    String name,
    String email,
    String assignedLineName,
    boolean canDelete
    // TODO: add Monthly Tickets count ,
) {}
