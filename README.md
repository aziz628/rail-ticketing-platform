# SNCFT Rail Ticketing Platform

A railway management and ticketing platform built for SNCFT . 

## Architecture
This is a monorepo containing:
- **Backend**: Spring Boot 4.0.5 (Java 21) REST API.
- **Frontend**: React 19 + Vite + TailwindCSS + Shadcn UI + Zustand + React Query.
- **Database**: PostgreSQL (managed via Flyway migrations) + Redis (for OTPs and rate limiting).
- **Deployment**: Fully containerized using Docker & Nginx proxy.

## features
core administrative foundations of the platform:
- **Auth & Security**: Stateful authentication using sessions, OTP email recovery, secure RBAC (Role-Based Access Control) separating Voyagers from Staff.
- **Infrastructure Management**: Full CRUD for Train Types, Stations, and Lines 
- **Staff Management**: Creation and soft-deletion of Controllers and Agents, with secure auto-password generation and Line assignment.

## Local Development Setup

### 1. Requirements
- Docker & Docker Compose
- Java 21 (for Hybrid Dev)
- Node.js 20+ (for Hybrid Dev)

### 2. Hybrid Mode (Recommended for Development)
1. Start only the databases (Postgres & Redis):
```bash
docker-compose up postgres redis -d
```
2. Start the Backend:
```bash
cd backend
mvn spring-boot:run
```
3. Start the Frontend:
```bash
cd frontend
npm install
npm run dev
```

### 3. Full Docker Mode
Spin up the entire stack (Database, Backend, Frontend, and Nginx proxy) via Docker:
```bash
docker-compose up --build
```

## Testing
- **backend** :  
```bash
cd backend
mvn test
```

- **frontend** : The frontend includes a End-to-End testing  using Playwright and MSW (Mock Service Worker).
```bash
cd frontend
npm run test:e2e
```
