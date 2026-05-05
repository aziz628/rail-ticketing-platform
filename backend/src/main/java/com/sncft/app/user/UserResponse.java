package com.sncft.app.user;

public record UserResponse(
        String name,
        String nationalIdType,
        String nationalIdNumber,
        String email,
        UserRole role
) {
}
