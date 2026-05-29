package com.sncft.app.subscription;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SubscriptionMapper {

    @Mapping(target = "requestId", source = "request.id")
    @Mapping(target = "lineName", source = "request.line.name")
    @Mapping(target = "categoryName", source = "request.category.name")
    @Mapping(target = "duration", source = "request.duration")
    SubscriptionResponse toResponse(Subscription subscription);
}
