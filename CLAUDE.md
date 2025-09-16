# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

**Pet of the Day** is a full-stack application with a Go backend and React Native mobile frontend. The project follows Domain-Driven Design (DDD) and Clean Architecture principles.

### Structure
- `backend/` - Go API server with DDD/Clean Architecture
- `mobile/` - React Native app using Expo

### Backend Architecture (Go)
The backend follows Domain-Driven Design with bounded contexts:

```
backend/internal/
├── shared/          # Cross-cutting concerns
│   ├── auth/        # JWT authentication
│   ├── database/    # Database connection & factory
│   ├── errors/      # Common errors
│   ├── events/      # Event bus system
│   └── types/       # Shared value objects
├── user/            # User bounded context
│   ├── domain/      # Business logic & rules
│   ├── application/ # Use cases (commands/queries)
│   ├── infrastructure/ # Data persistence
│   └── interfaces/  # HTTP controllers
└── pet/             # Pet bounded context
    ├── domain/      # Pet business logic
    ├── application/ # Pet use cases
    ├── infrastructure/ # Pet persistence
    └── interfaces/  # Pet HTTP API
```

**Key Patterns:**
- **CQRS** with separate commands and queries
- **Repository pattern** with mock implementations for testing
- **Event-driven architecture** with in-memory event bus
- **Dependency inversion** - interfaces in domain, implementations in infrastructure

### Mobile Architecture (React Native)
```
mobile/src/
├── screens/         # Screen components
├── shared/          # Reusable UI components
├── navigation/      # Navigation configuration
├── utils/           # Utility functions
└── constants/       # App constants
```

Uses TypeScript with path aliases configured in `tsconfig.json`.

## Common Development Commands

### Backend Development
```bash
# Development setup (from backend/ directory)
just dev              # Start complete development environment
just start            # Start services only
just stop             # Stop all services
just restart          # Restart services

# Testing
just test             # Run all tests
just test user        # Run user context tests only
just test pet         # Run pet context tests only
just test-coverage    # Run tests with coverage report
just test-unit        # Run domain layer tests only
just test-integration # Run infrastructure tests only

# Database & Schema
just ent-migrate      # Apply Ent schema changes
just ent-status       # Check Ent schema status
just db               # Open PostgreSQL shell
just seed             # Insert test data

# Code Quality
just lint             # Run golangci-lint
just fmt              # Format Go code
just validate         # Run all validation (fmt, lint, tests, architecture)
just security-scan    # Run vulnerability scan

# Development Tools
just logs             # View all service logs
just logs-service api # View API logs only
just shell            # Open shell in API container
just diagnose         # Complete project diagnostic
```

### Mobile Development
```bash
# Development (from mobile/ directory)
yarn start            # Start Expo development server
yarn android          # Run on Android
yarn ios              # Run on iOS
yarn web              # Run on web

# Testing & Quality
yarn test             # Run Jest tests
yarn test:coverage    # Run tests with coverage
yarn lint             # Run ESLint
yarn type-check       # Run TypeScript compiler
yarn prettier         # Format code

# Building
yarn build            # Build for production
yarn prebuild         # Generate native code
```

## Database & ORM

- **Database**: PostgreSQL with Docker Compose
- **ORM**: Ent (schema-first, type-safe Go ORM)
- **Migrations**: Handled by Ent schema changes + `just ent-migrate`

When modifying database schema:
1. Edit files in `backend/ent/schema/`
2. Run `just ent-migrate` to apply changes
3. Use `just ent-status` to verify compilation

## Testing Strategy

**Backend:**
- **Unit tests**: Domain logic and value objects
- **Integration tests**: Repository implementations
- **HTTP tests**: Controller endpoints
- **Architecture tests**: Validate DDD patterns and bounded context isolation

**Mobile:**
- Jest for unit/integration testing
- TypeScript for compile-time checks

## Development Environment

**Prerequisites:**
- Docker & Docker Compose
- Just command runner (https://github.com/casey/just)
- Node.js & Yarn (for mobile)
- Go 1.24+ (optional, runs in Docker)

**Services (when running):**
- API: http://localhost:8080
- Adminer (DB UI): http://localhost:8081
- PostgreSQL: localhost:5432

## Key Technologies

**Backend:**
- Go 1.24 with Gorilla Mux
- Ent ORM (schema-first, type-safe)
- PostgreSQL 15
- JWT authentication
- Testify for testing

**Mobile:**
- React Native with Expo
- TypeScript
- React Navigation
- Redux Toolkit + React Query
- React Hook Form + Yup validation

## Architecture Validation

The project includes architectural tests to ensure DDD principles:
- Bounded contexts are properly isolated
- Dependencies flow correctly (domain → application → infrastructure)
- Cross-context communication only through domain/application layers

Run `just test-architecture` to validate these constraints.

## Bounded Context Guidelines

When working on features:
- **User context**: Authentication, user management, profiles
- **Pet context**: Pet CRUD, owner/co-owner relationships
- **Shared**: Cross-cutting concerns (auth, database, events, types)

Avoid direct dependencies between bounded contexts at infrastructure/interfaces layers.