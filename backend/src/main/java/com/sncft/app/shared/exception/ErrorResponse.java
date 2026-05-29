package com.sncft.app.shared.exception;

import java.time.LocalDateTime;

// This is the error response returned when your backend fails.
public record ErrorResponse(
        int status,
        String error,
        String message,
        String path,
        String timestamp) {
    // constructor to add current timestamp automatically
    public ErrorResponse(int status, String error, String message, String path) {
        this(status, error, message, path, LocalDateTime.now().toString());
    }
}
