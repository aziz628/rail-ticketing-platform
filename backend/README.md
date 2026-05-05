# SNCFT Railway Ticketing Platform – Backend

This is the Spring Boot backend application for the SNCFT railway ticketing and subscriptions management platform.

## Technology Stack
*   **Java 21**
*   **Spring Boot 4.x** (Web, Data JPA, Security, Mail, Validation)
*   **PostgreSQL 16** (Primary Database)
*   **Redis 7** (Session Management & OTP Caching)
*   **Flyway** (Database Migrations)
*   **MapStruct & Lombok** (Boilerplate reduction)
*   **JUnit 5 & MockMvc** (Integration Testing)

## Project Architecture
the project is built using DDD and layered architecture pattern.

## Configuration & Setup

We use Mailtrap for email notifications. For security, credentials are not committed to version control.

1. Navigate to the backend resources directory:
   ```bash
   cd src/main/resources
   ```
2. Copy the example configuration file:
   ```bash
   cp application.properties.example application.properties
   ```
3. Open `application.properties` and add your Mailtrap credentials:
   ```properties
   spring.mail.username=your_mailtrap_username
   spring.mail.password=your_mailtrap_password
   ```


## Testing

The backend includes a comprehensive integration test suite. We use H2 in-memory database for testing to ensure isolation and speed.

To run all tests:
```bash
./mvnw test
```

### Testing Standards
*   We use `@MockitoBean` for mocking external dependencies (e.g., `EmailService`).
*   Tests manually orchestrate database cleanup (`deleteAll()`) in a specific reverse-FK order instead of using class-level `@Transactional` to avoid HTTP Session and Transaction context conflicts.
