package com.sncft.app.infrastructure.line;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LineResponse(
    UUID id,
    String name,
    List<LineNodeResponse> nodes,
    Boolean canDelete
) {}
