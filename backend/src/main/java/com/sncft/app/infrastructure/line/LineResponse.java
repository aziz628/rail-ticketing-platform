package com.sncft.app.infrastructure.line;

import java.util.List;
import java.util.UUID;

public record LineResponse(
    UUID id,
    String name,
    List<LineNodeResponse> nodes,
    boolean canDelete
) {}
