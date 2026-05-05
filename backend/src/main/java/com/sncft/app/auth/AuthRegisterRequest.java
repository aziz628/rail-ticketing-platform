package com.sncft.app.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record AuthRegisterRequest(
        // voyager have enum for nationalIdType 
        @NotBlank @Size(max = 30) @Pattern(regexp = "^(CIN|BIRTH_CERT)$") String nationalIdType,
        @NotBlank @Size(max = 50) @Pattern(regexp = "^(.{8}|.{12})$") String nationalIdNumber,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 255) String password
) {
}
