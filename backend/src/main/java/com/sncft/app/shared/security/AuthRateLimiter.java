package com.sncft.app.shared.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sncft.app.shared.exception.ErrorResponse;
// jackson for json serialization
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Standard Rate Limiter for Authentication endpoints.
 * Limits: 10 requests per minute per IP.
 */
@Component
@Profile("!test")
public class AuthRateLimiter extends OncePerRequestFilter {

    // create a map to store the rates buckets for each IP
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper; 
    
    // Dependency Injection
    public AuthRateLimiter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Only apply to auth endpoints
        if (request.getRequestURI().contains("/auth/")) {
            // get the IP of the request
            String ip = request.getRemoteAddr();

            // get or create a bucket for the IP (save requests count from the same IP)
            Bucket bucket = buckets.computeIfAbsent(ip, this::createNewBucket);

            // check ability to make request. if request count limit per IP is reached return 429
            if (!bucket.tryConsume(1)) { 

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());

                // use Error response dto 
                ErrorResponse errorResponseDto = new ErrorResponse(
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                    "Trop de tentatives de connexion. Veuillez réessayer plus tard.",
                    request.getRequestURI()
                );
                // serialize error dto to json format and send it using response writer
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(errorResponseDto));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Create a new bucket for the IP
     * @param ip the IP address
     * @return the bucket 
     * bucket is a container for tokens
     * tokens represent the number of requests that can be made 
     * we set the initial number of tokens to 10 and the refill interval to 1 minute
     * this means that the IP can make 10 requests per minute 
     */
    private Bucket createNewBucket(String ip) {
        //  define limits
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(10)
                        .refillIntervally(10, Duration.ofMinutes(1))
                        .build())
                .build();
    }
}
