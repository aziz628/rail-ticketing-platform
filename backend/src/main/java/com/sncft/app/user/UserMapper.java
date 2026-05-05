package com.sncft.app.user;

import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    // the genereated method will map repeated fields between User and UserResponse 
    UserResponse toResponse(User user);
}
