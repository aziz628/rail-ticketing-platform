package com.sncft.app.schedule;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ControllerReassignRequest(
    @NotNull(message = "L'identifiant du contrôleur est requis")
    UUID controllerId
) {}
