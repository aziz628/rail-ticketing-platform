package com.sncft.app.user;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        NationalIdType nationalIdType,
        String nationalIdNumber,
        String email,
        UserRole role
) {
}
