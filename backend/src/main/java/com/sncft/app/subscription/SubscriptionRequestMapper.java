package com.sncft.app.subscription;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubscriptionRequestMapper {

    @Mapping(target = "lineName", source = "line.name")
    @Mapping(target = "categoryName", source = "category.name")
    SubscriptionRequestResponse toResponse(SubscriptionRequest request);

    @Mapping(target = "voyagerName", source = "user.name")
    @Mapping(target = "lineName", source = "line.name")
    @Mapping(target = "categoryName", source = "category.name")
    StaffSubscriptionRequestResponse toStaffResponse(SubscriptionRequest request);
}
