# SNCFT Railway Ticketing Platform – Frontend

A modern, secure React + TypeScript application for railway ticketing, subscriptions, and administrative operations. Built with **Vite**, **Tailwind CSS**, **Shadcn UI**, and **React Query** for a fast, responsive user experience.

## List of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Development Guidelines](#development-guidelines)
- [Docker Setup](#docker-setup)

---

## Features

### Authentication & User Management
- **User Registration & Login**: Secure credential validation with JWT-based session management.
- **Password Recovery**: OTP-based password reset flow.
- **Role-Based Access Control**: Separate portals for Voyagers (Clients), Agents, Controllers, and Admins.
- **Session Hydration**: Automatic user data refresh on app load via `getMe` endpoint.

### Voyager Features (Client Portal)
- **Trip Search & Booking**: Real-time trip availability with dynamic pricing.
- **Ticket Management**: View ticket history, QR code display, PDF download.
- **Subscriptions**: Browse and apply for subscription offers with agent approval workflow.
- **Payment Integration**: Mock PSP checkout flow with seat locking and retry capability.

### Administrative Features (Staff Portal)
- **Infrastructure Management**: Create and manage stations, lines, and train types.
- **Schedule Management**: Design trip schedules with station stops and timing.
- **Trip Sync**: Auto-generate trips from schedules via Cron or manual trigger.
- **Subscription Requests**: Agent workflow for approving/rejecting user subscription applications.
- **Dashboard & Analytics**: Real-time metrics, revenue tracking, and performance statistics.
- **Staff Management**: Admin capabilities for creating agents and controllers.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React | 19.x |
| **Language** | TypeScript | 5.x |
| **Build Tool** | Vite | 6.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **UI Components** | Shadcn UI | Latest |
| **Data Fetching** | React Query (TanStack) | 5.x |
| **State Management** | Zustand | Latest |
| **HTTP Client** | Axios | Latest |
| **Form Validation** | Zod + React Hook Form | Latest |
| **Routing** | React Router | 7.x |
| **Testing (E2E)** | Playwright | Latest |
| **API Mocking (Tests)** | MSW (Mock Service Worker) | Latest |
| **Containerization** | Docker + Docker Compose | Latest |
| **Web Server** | Nginx | Latest |


---

## Project Structure

```
src/
├─ app/                          # Application Layer (Entry point & routing)
│  ├─ provider.tsx               # Global providers (QueryClient, Router context)
│  ├─ router.tsx                 # Central route definitions
│  ├─ app.tsx                    # Root component
│  └─ routes/                    # Route guards and layout composition
│     ├─ GuestOnlyRoute.tsx       # Redirect authenticated users away from auth pages
│     ├─ ProtectedRoute.tsx       # Redirect unauthenticated users to login
│     └─ AppRoutes.tsx            # Full route tree assembly
├─ features/                     # Feature Modules (Feature-first architecture)
│  ├─ auth/                      # Authentication module
│  │  ├─ components/             # LoginForm, RegisterForm, ResetPasswordForm
│  │  ├─ pages/                  # LoginPage, RegisterPage, etc.
│  │  ├─ hooks/                  # useLoginMutation, useRegisterMutation
│  │  ├─ api.ts                  # Auth endpoints (login, register, resetPassword)
│  │  ├─ schemas.ts              # Zod validation schemas
│  │  └─ types.ts                # Auth DTOs (User, LoginRequest, etc.)
│  ├─ trips-voyager/             # Trip search & booking
│  ├─ tickets/                   # Ticket history & QR viewer
│  ├─ subscriptions/             # Subscription offers & forms
│  ├─ admin-*/                   # Admin feature modules (schedules, infrastructure, etc.)
│  └─ dashboard/                 # Stats, metrics, real-time updates
├─ components/                   # Shared UI Components
│  ├─ ui/                        # Shadcn components (Button, Input, Card, etc.)
│  ├─ layouts/                   # Layout shells (AuthLayout, PrivateLayout, etc.)
│  ├─ Header.tsx                 # App header with role-aware nav
│  ├─ Sidebar.tsx                # Dashboard sidebar
│  └─ notifications/             # Toast/notification components
├─ lib/                          # Preconfigured Libraries
│  ├─ axios.ts                   # Axios instance with interceptors
│  ├─ react-query.ts             # QueryClient configuration
│  └─ utils.ts                   # Helper functions (cn, formatDate, etc.)
├─ hooks/                        # Shared Custom Hooks
│  ├─ useAuthStore.ts            # Zustand auth state
│  ├─ useDisclosure.ts           # Modal/drawer open/close logic
│  └─ (other shared hooks)
├─ stores/                       # Global State (Zustand)
│  └─ auth.ts                    # User, isAuthenticated, login/logout actions
├─ types/                        # Shared TypeScript Types
│  ├─ api.ts                     # API DTOs (backend response shapes)
│  └─ auth.ts                    # Auth-related types (User, Role, etc.)
├─ testing/                      # Test Utilities & Mocks
│  └─ mocks/                     # MSW handlers & mock database
│     ├─ browser.ts              # MSW browser worker setup
│     ├─ handlers/               # Request handlers per feature (auth.ts, etc.)
│     ├─ db.ts                   # In-memory mock database & seeding
│     └─ enable-mocking.ts       # Initialize MSW in dev/test
├─ main.tsx                      # Entry point (creates React root)
└─ index.css                     # Global Tailwind directives & fonts

e2e/
└─ profile.spec.ts               # E2E test suite (login, register, auth flows)

public/
├─ mockServiceWorker.js          # MSW worker (auto-generated)
└─ favicon.ico
```

---

## Testing

### E2E Tests (Playwright)
```bash
npm run test:e2e                 # Run E2E tests in headless mode
npm run test:e2e:headed          # Run E2E tests with visible browser
npm run test:e2e:debug           # Run with Playwright Inspector for debugging
```

**Test Suite**: `e2e/auth.spec.ts`
- Login flow → profile renders user data
- Register flow → creates user and redirects to profile
- Forgot password flow → OTP-based reset
- Logout flow → redirects to login

**API Mocking**: Tests use **MSW (Mock Service Worker)** to intercept `/api/*` calls. No backend required for E2E tests.

### How MSW Works in Tests
1. Playwright loads the Vite dev server.
2. The app loads the MSW browser worker from `public/mockServiceWorker.js`.
3. Handlers in `src/testing/mocks/handlers/` intercept all HTTP calls.
4. In-memory mock database (`src/testing/mocks/db.ts`) stores users, sessions, and OTPs.
5. Tests assert UI behavior based on mock API responses.

---

## Development Guidelines

### Architecture Principles

1. **Unidirectional Data Flow**: Shared → Features → App
   - Shared utilities and components do not import from features.
   - Features can import from shared/lib but not from other features.

2. **Feature Isolation**:
   - Use `src/app` composition layer to put features together.
   - Prevents dependencies conflicts and encourages module independence.

4. **Type Safety First**
   - All backend responses must be typed in `src/types/` or `src/features/[feature]/types/`.
   - Use Zod for form validation and runtime type-checking.
   - Map Java DTOs to TypeScript exactly

5. **React Query as the Source of data**
   - All server state lives in React Query cache.
   - Use mutations for side effects (login, register, etc.).
   - Use queries for data fetching with automatic background refetching.

6. **Zustand for Auth State Only**
   - Keep `useAuthStore` minimal: `user`, `isAuthenticated`, `login()`, `logout()`.
   - Let React Query handle API responses; Zustand tracks user context.

7. **Protected Routes & Route Guards**
   - `ProtectedRoute`: Redirects unauthenticated users to `/login`.
   - `GuestOnlyRoute`: Redirects authenticated users away from auth pages.
   - Use conditional rendering in `AppRoutes.tsx` to assemble routes.

### Code Style

- **Formatting**: Tailwind classes → utility-first.
- **Naming**: Components are PascalCase (`LoginForm.tsx`), utilities are camelCase (`useLoginMutation.ts`).
- **Exports**: Default exports for pages/components, named exports for utilities and hooks.


---

## Security Features

- **HttpOnly Cookies**: JWT tokens stored in HttpOnly cookies (not accessible from JavaScript).
- **CORS Bypass**: Nginx acts as a reverse proxy, eliminating frontend CORS issues.
- **Credential Validation**: Zod + React Hook Form validate user input before submission.
- **Role-Based Access**: Routes and UI elements conditionally render based on user role from JWT.
- **Rate Limiting**: Backend enforces per-user rate limits (20 req/min for users, 50 req/min for admins).

---

## Deployment

### Build for Production
```bash
npm run build     # Generates dist/ folder with optimized files
npm run preview   # Test production build locally
```

### Deploy to Nginx (Docker)
- The `Dockerfile` multi-stage build compiles React and prepares Nginx.
- Push the built image to your container registry.
- Orchestrate with Kubernetes or Docker Swarm as needed.

---

## Environment Variables
copy `env.example` into `.env` file  and edit values used by runtime.

```bash
cp .env.example .env
```

