package com.sncft.app.shared.exception;

/**
 * Thrown when a requested resource (User, Train, etc.) is not found.
 * Maps to 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
