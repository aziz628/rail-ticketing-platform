package com.sncft.app.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.GONE)
public class MaxAttemptsReachedException extends RuntimeException {
    public MaxAttemptsReachedException(String message) {
        super(message);
    }
}
