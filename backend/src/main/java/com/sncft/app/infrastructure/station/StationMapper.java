package com.sncft.app.infrastructure.station;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StationMapper {
    
    @Mapping(target = "canDelete", ignore = true)
    StationResponse toResponse(Station station);
    
    @Mapping(target = "id", ignore = true)
    Station toEntity(StationRequest request);
}
