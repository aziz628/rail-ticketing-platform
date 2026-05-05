package com.sncft.app.shared.exception;

import java.time.LocalDateTime;

// Java records are immutable by default - perfect for a simple Error DTO.
// This is the clean structure returned when your backend fails.
public record ErrorResponse(
        int status,
        String error,
        String message,
        String path,
        String timestamp) {
    // Helper constructor to add 'now()' timestamp automatically
    public ErrorResponse(int status, String error, String message, String path) {
        this(status, error, message, path, LocalDateTime.now().toString());
    }
}
