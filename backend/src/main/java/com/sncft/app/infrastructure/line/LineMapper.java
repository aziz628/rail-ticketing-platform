package com.sncft.app.infrastructure.line;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LineMapper {
    
    @Mapping(target = "canDelete", source = "canDelete")
    LineResponse toResponse(Line line, Boolean canDelete);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "nodes", ignore = true)
    Line toEntity(LineRequest request);

    @Mapping(target = "stationName", source = "station.name")
    LineNodeResponse toNodeResponse(LineNode node);
}
