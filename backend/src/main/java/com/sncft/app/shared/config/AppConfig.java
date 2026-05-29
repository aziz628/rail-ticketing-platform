package com.sncft.app.shared.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class AppConfig {

    // Password Encoder Bean (Spring Security will use this to verify passwords later)
    // BCrypt is the industry standard for safe password hashing.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ObjectMapper Bean for JSON processing (used by GovValidationService)
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    // Global CORS Configuration (Spring Security way)
    // Ensures even unauthorized requests (401, 403) from React don't fail with ugly CORS network errors in the browser.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Create a new CORS configuration object
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allowed origins (Update to match the environments)
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost")); 
        
        // Allowed HTTP Methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // Allowed Headers 
        configuration.setAllowedHeaders(List.of("*"));
        
        // Whether we allow Cookies or Auth headers to be passed down 
        configuration.setAllowCredentials(true);
        
        // Finally apply rules to all endpoints inside our app
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
