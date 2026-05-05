package com.sncft.app.infrastructure.train;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TrainMapper {
    
    @Mapping(target = "canDelete", source = "canDelete")
    TrainResponse toResponse(Train train, boolean canDelete);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "seatClasses", ignore = true)
    Train toEntity(TrainRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "seatClasses", ignore = true)
    void updateEntity(TrainPatchRequest request, @MappingTarget Train train);

    SeatClassResponse toSeatClassResponse(SeatClass seatClass);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "train", ignore = true)
    SeatClass toSeatClassEntity(SeatClassRequest request);
}
