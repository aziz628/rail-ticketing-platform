package com.sncft.app.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.shared.dto.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration // Marks this as a configuration class
@EnableWebSecurity // Turns on Spring Security filter chain
@EnableMethodSecurity // Allows @PreAuthorize on methods
public class SecurityConfig {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired(required = false)
    private AuthRateLimiter authRateLimiter;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Security Filter Chain: Defines what is blocked and permitted
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // Session-based auth still uses cookie-backed state
                .csrf(AbstractHttpConfigurer::disable)

                // JSON login endpoints do not need the default HTML form login.
                .formLogin(AbstractHttpConfigurer::disable)

                // Link the CORS config from AppConfig implicitly by doing this:
                .cors(Customizer.withDefaults()) // withDefaults(): look for @CorsConfigurationSource bean and use it

                // Sessions are now part of the plan, so Spring create them when authentication
                // succeeds.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                // Define endpoint access rules
                .authorizeHttpRequests(auth -> auth
                        // context-path in application.properties already adds /api prefix to ALL
                        // routes.
                        // So here we write paths WITHOUT /api (Spring sees /auth/**, not /api/auth/**)
                        .requestMatchers(
                                "/auth/**",
                                "/trips/search",
                                "/trips/*/booking-details",
                                "/stations",
                                "/lines",
                                "/subscription-categories",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html")
                        .permitAll()

                        // Every other request explicitly needs an authenticated user
                        .anyRequest().authenticated())

                // logout configuration
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200);
                            response.setContentType("application/json");
                            response.getWriter().write(
                                    objectMapper.writeValueAsString(
                                            new MessageResponse("Logged out successfully")));
                        }));

        // add the rate limiter before the first authentication filter of spring
        // security (to prevent brue force attacks)
        if (authRateLimiter != null) {
            http.addFilterBefore(authRateLimiter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }
}
