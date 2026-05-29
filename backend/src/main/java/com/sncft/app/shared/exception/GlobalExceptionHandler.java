package com.sncft.app.shared.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.security.access.AccessDeniedException;
import lombok.extern.slf4j.Slf4j;

/**
 * Global centralized error handling.
 * Every controller exception ends up here.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 400 - BAD REQUEST (Validation, Type Mismatch & Logic)
    @ExceptionHandler({
            MethodArgumentNotValidException.class, 
            BindException.class,
            MissingServletRequestParameterException.class,
            IllegalArgumentException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex, WebRequest request) {
        log.warn("Bad Request at {}: {}", request.getDescription(false), ex.getMessage());
        
        String message = ex.getMessage();
        // handle the @Valid errors
        if (ex instanceof MethodArgumentNotValidException validationEx) {
            message = validationEx.getBindingResult().getFieldErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .findFirst()
                    .orElse("un ou plusieurs champs sont invalides");
        } 
        else if (ex instanceof BindException bindEx) {
            // handle the type mismatch errors in DTO binding (query params)
            message = bindEx.getFieldErrors().stream()
                    .map(error -> "format de paramètre invalide pour: " + error.getField())
                    .findFirst()
                    .orElse("un ou plusieurs paramètres sont invalides");
        }
        else if (ex instanceof MissingServletRequestParameterException missingEx) {
            message = "le paramètre '" + missingEx.getParameterName() + "' est requis";
        }
        // handle the type mismatch errors for single @RequestParam
        else if (ex instanceof MethodArgumentTypeMismatchException typeEx) {
            message = "format de paramètre invalide pour: " + typeEx.getName();
        }
        
        return buildResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    // 400 - BAD REQUEST (Malformed JSON)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, WebRequest request) {
        log.warn("Malformed JSON at {}: {}", request.getDescription(false), ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "format de données invalide", request);
    }

    // 401 - UNAUTHORIZED (Authentication failures)
    @ExceptionHandler({InvalidCredentialsException.class, AuthenticationException.class})
    public ResponseEntity<ErrorResponse> handleUnauthorized(Exception ex, WebRequest request) {
        log.warn("Unauthorized at {}: {}", request.getDescription(false), ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    // 403 - FORBIDDEN (Permission issues)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException ex, WebRequest request) {
        log.warn("Forbidden at {}: {}", request.getDescription(false), ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "accès refusé", request);
    }

    // 404 - NOT FOUND (Missing resources or invalid paths)
    @ExceptionHandler({
            ResourceNotFoundException.class,
            GovIdentityNotFoundException.class,
            NoResourceFoundException.class
    })
    public ResponseEntity<ErrorResponse> handleNotFound(Exception ex, WebRequest request) {
        log.warn("Not Found at {}: {}", request.getDescription(false), ex.getMessage());
        String message = (ex instanceof NoResourceFoundException) ? "ressource non trouvée" : ex.getMessage();
        return buildResponse(HttpStatus.NOT_FOUND, message, request);
    }

    // 409 - CONFLICT (Duplicate data or relationship violation)
    @ExceptionHandler({DuplicateResourceException.class, DataConflictException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ErrorResponse> handleConflict(Exception ex, WebRequest request) {
        log.warn("Conflict at {}: {}", request.getDescription(false), ex.getMessage());
        String message = (ex instanceof DataIntegrityViolationException) ? "conflit de données" : ex.getMessage();
        return buildResponse(HttpStatus.CONFLICT, message, request);
    }

    // 405 - METHOD NOT ALLOWED (Wrong HTTP verb)
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex, WebRequest request) {
        log.warn("Method Not Allowed at {}: {}", request.getDescription(false), ex.getMessage());
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, "méthode non autorisée", request);
    }

    // 410 - GONE (Session expired/removed)
    @ExceptionHandler(MaxAttemptsReachedException.class)
    public ResponseEntity<ErrorResponse> handleMaxAttemptsReached(MaxAttemptsReachedException ex, WebRequest request) {
        log.warn("Payment session terminated: {}", ex.getMessage());
        return buildResponse(HttpStatus.GONE, ex.getMessage(), request);
    }
  

    // helper method to build error response merging body and headers 
    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, WebRequest request) {
        ErrorResponse errorDetails = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getDescription(false)
        );
        return new ResponseEntity<>(errorDetails, status);
    }
    
    // 500 - INTERNAL SERVER ERROR (The fallback)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalExceptions(Exception ex, WebRequest request) {
        log.error("Unhandled exception at {}: {}", request.getDescription(false), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "une erreur inattendue s'est produite", request);
    }
}
