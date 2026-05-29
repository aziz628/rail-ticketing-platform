package com.sncft.app.infrastructure.station;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StationResponse(
    UUID id,
    String name,
    Boolean canDelete
) {}
