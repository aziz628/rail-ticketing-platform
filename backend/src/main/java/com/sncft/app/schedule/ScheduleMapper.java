package com.sncft.app.schedule;

import java.time.LocalDate;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.sncft.app.schedule.ScheduleResponse.ScheduleStopResponse;

@Mapper(componentModel = "spring")
public interface ScheduleMapper {

    @Mapping(target = "lineName", source = "schedule.line.name")
    @Mapping(target = "trainName", source = "schedule.train.name")
    @Mapping(target = "controllerName", source = "schedule.controller.name")
    @Mapping(target = "canDelete", source = "canDelete")
    @Mapping(target = "canDeactivate", expression = "java(schedule.getDeactivationDate() == null)")
    @Mapping(target = "minDeactivationDate", source = "minDeactivationDate")
    ScheduleResponse toResponse(TripSchedule schedule, Boolean canDelete, LocalDate minDeactivationDate);

    @Mapping(target = "lineName", source = "line.name")
    @Mapping(target = "trainName", source = "train.name")
    @Mapping(target = "controllerName", source = "controller.name")
    @Mapping(target = "canDelete", ignore = true)
    @Mapping(target = "canDeactivate", ignore = true)
    @Mapping(target = "minDeactivationDate", ignore = true)
    ScheduleResponse toResponse(TripSchedule schedule);

    @Mapping(target = "stationName", source = "lineNode.station.name")
    @Mapping(target = "kmFromSource", source = "lineNode.kmFromSource")
    ScheduleStopResponse toStopResponse(TripStop stop);
}
