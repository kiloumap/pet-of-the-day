# Pet of the Day 🐕🐱

A social and gamified application for pet owners that transforms daily life with their pets into a community-driven experience.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Just (recommended) - Install: https://github.com/casey/just

### Installation

1. **Clone the project**
```bash
git clone https://github.com/your-username/pet-of-the-day.git
cd pet-of-the-day/backend
```

2. **Make scripts executable**
```bash
chmod +x scripts/*.sh
```

3. **Start the application**
```bash
just dev
# or
just start
```

The application will be available at:
- **API**: http://localhost:8080
- **Adminer** (DB interface): http://localhost:8081
- **Database**: localhost:5432

## 📚 Useful Commands

### With Just (recommended)
```bash
just help              # Show all commands
just start             # Start services
just stop              # Stop services
just logs              # View logs
just shell             # Shell into API container
just db                # PostgreSQL shell
just migrate-up        # Apply migrations
just test              # Run tests
just test user         # Run user context tests only
just test pet          # Run pet context tests only
```

### With scripts
```bash
./scripts/dev.sh start        # Start
./scripts/dev.sh stop         # Stop
./scripts/dev.sh logs api     # API logs
./scripts/migrate.sh up       # Migrations
./scripts/migrate.sh create migration_name  # New migration
```

## 🏗️ Architecture

### Project Structure
```
backend/
├── cmd/server/          # Application entry point
├── internal/            # Internal application code
│   ├── shared/         # Shared components
│   │   ├── auth/       # JWT authentication
│   │   ├── database/   # Database connection & factory
│   │   ├── errors/     # Common errors
│   │   ├── events/     # Event bus system
│   │   └── types/      # Shared value objects
│   ├── user/           # User bounded context
│   │   ├── domain/     # Business logic & rules
│   │   ├── application/# Use cases (commands/queries)
│   │   ├── infrastructure/ # Data persistence
│   │   └── interfaces/ # HTTP controllers
│   └── pet/            # Pet bounded context
│       ├── domain/     # Pet business logic
│       ├── application/# Pet use cases
│       ├── infrastructure/ # Pet persistence
│       └── interfaces/ # Pet HTTP API
├── ent/                # Ent ORM generated code
├── scripts/            # Automation scripts
├── Dockerfile          # Docker image
├── docker-compose.yml  # Service orchestration
└── justfile           # Command automation
```

### Architecture Patterns
- **Domain-Driven Design (DDD)** with bounded contexts
- **Clean Architecture** with dependency inversion
- **CQRS** pattern with commands and queries
- **Repository pattern** with mock implementations
- **Event-driven architecture** with in-memory bus

### Tech Stack
- **Backend**: Go 1.24 with Gorilla Mux
- **ORM**: Ent (schema-first, type-safe)
- **Database**: PostgreSQL 15
- **Authentication**: JWT tokens
- **Testing**: Testify with mock repositories
- **Containerization**: Docker & Docker Compose

## 🗄️ Database Schema

### Core Entities

- **users**: Application users
- **pets**: Pet animals with owner/co-owner relationships
- **groups**: Community groups (family, neighborhood, friends)
- **behaviors**: Configurable behaviors with point values
- **score_events**: Daily scoring events
- **daily_scores**: Aggregated scores by day and group

### Migrations

```bash
# Apply all migrations
just migrate-up

# Create new migration
just migrate-create add_new_feature

# Check status
just migrate-status

# Rollback
just migrate-down
```

## 🔌 API Endpoints

### Authentication
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
```

### Users
```http
GET /api/users/me          # Current user profile
```

### Pets
```http
GET    /api/pet/owned      # Get owned pets
GET    /api/pet/co-owned   # Get co-owned pets
POST   /api/pet/add        # Create a pet
GET    /api/pet/{id}       # Get pet details
POST   /api/pet/co-owner   # Add co-owner to pet
```

### Health Check
```http
GET /health                # API health status
```

## 🧪 Testing

### Run Tests
```bash
# All tests
just test

# Specific bounded context
just test user
just test pet

# With coverage
just test-coverage

# Unit tests only
just test-unit

# Integration tests only
just test-integration
```

### Test Structure
- **Unit tests**: Domain logic and value objects
- **Integration tests**: Repository implementations
- **HTTP tests**: Controller endpoints
- **Mock repositories**: For isolated testing

## 🔧 Development

### Environment Variables

Create a `.env` file (optional, defaults work out of the box):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=pet_of_the_day
JWT_SECRET=your-super-secret-jwt-key
PORT=8080
```

### Development Workflow

1. **Make changes** to the code
2. **Rebuild** if needed: `just build`
3. **Restart**: `just restart`
4. **View logs**: `just logs`
5. **Test**: `just test`
6. **Validate**; `just validate`
### Hot Reload Development

```bash
# Install air for hot reload
go install github.com/air-verse/air@latest

# Start with hot reload
just dev-watch
```

### Creating New Migration

```bash
# Create migration files
just migrate-create add_notifications

# Edit generated files
# Then apply
just migrate-up
```

### Debug Commands

```bash
# Real-time logs
just logs-service api

# Shell into container
just shell

# Direct DB access
just db

# Service status
just status
```

## 📝 Usage Examples

### User Registration & Login

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Pet Management

```bash
# Create a pet
curl -X POST http://localhost:8080/api/pet/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "owner_id": "user-uuid",
    "name": "Rex",
    "species": "dog",
    "breed": "Golden Retriever",
    "birth_date": "2023-01-15T00:00:00Z",
    "photo_url": "https://example.com/photo.jpg"
  }'

# Add co-owner
curl -X POST http://localhost:8080/api/pet/co-owner \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pet_id": "pet-uuid",
    "co_owner_id": "user-uuid"
  }'
```

## 🚀 Deployment

### Production Build

```bash
# Build production image
just prod-build

# Run in production
docker run -d \
  --name pet-of-the-day \
  -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-secure-password \
  -e JWT_SECRET=your-secure-jwt-secret \
  pet-of-the-day:latest
```

### Production Environment Variables

```env
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=pet_of_the_day
JWT_SECRET=your-very-secure-jwt-secret-256-bits
PORT=8080
```

## 🧰 Developer Tools

### Install Development Tools

```bash
just install-tools
```

This installs:
- golang-migrate (database migrations)
- golangci-lint (code linting)
- air (hot reload)
- ent (ORM code generation)

### Code Quality

```bash
# Lint code
just lint

# Format code
just fmt

# Security scan
just security-scan

# Check dependencies
just deps-check
```

## 🤝 Contributing

1. **Fork** the project
2. **Create branch**: `git checkout -b feature/new-feature`
3. **Commit**: `git commit -m 'Add new feature'`
4. **Push**: `git push origin feature/new-feature`
5. **Pull Request**

### Development Standards

- **Domain-Driven Design** principles
- **Clean Architecture** layers
- **Test-driven development**
- **Go idioms** and best practices
- **Comprehensive testing** (unit + integration)

## 📋 Roadmap

### Current Status
- ✅ User management (register/login/auth)
- ✅ Pet management (CRUD with owner/co-owner)
- ✅ Clean Architecture with DDD
- ✅ Repository pattern with mocks
- ✅ Event system foundation
- ✅ Comprehensive test suite

### Next Features
- [ ] Community groups management
- [ ] Scoring system with daily events
- [ ] "Pet of the Day" algorithm
- [ ] Real-time notifications with goroutines
- [ ] Image upload for pets
- [ ] Badge system
- [ ] GraphQL API (alternative to REST)
- [ ] Redis caching
- [ ] Monitoring and metrics

## 🐛 Troubleshooting

### Database Won't Start
```bash
# Check logs
just logs-service db

# Clean and restart
just clean
just start
```

### API Not Responding
```bash
# Check logs
just logs-service api

# Restart API
just restart
```

### Migration / Ent Error
```bash
# Check status
just ent-status
```

### Tests Failing
```bash
# Run specific test
just test pet

# Check coverage
just test-coverage

# Diagnose issues
just diagnose
```

## 📊 Project Stats

- **Architecture**: Domain-Driven Design + Clean Architecture
- **Test Coverage**: Comprehensive unit and integration tests
- **Code Organization**: Bounded contexts with clear separation
- **Development Experience**: Hot reload, automated migrations, comprehensive tooling

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [@kiloumap](https://github.com/kiloumap)
- **Concept**: Pet of the Day Social App

---

🐾 **Made with ❤️ for our four-legged friends!**