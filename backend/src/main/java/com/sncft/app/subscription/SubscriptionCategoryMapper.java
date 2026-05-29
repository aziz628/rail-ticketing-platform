package com.sncft.app.subscription;

import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SubscriptionCategoryMapper {
    SubscriptionCategoryResponse toResponse(SubscriptionCategory category);
}
