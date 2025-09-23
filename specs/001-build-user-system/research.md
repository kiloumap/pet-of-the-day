# Research: Pet Notebook System Implementation

## Technology Decisions

### Backend Extension Strategy

**Decision**: Extend existing Clean Architecture with new bounded contexts for Pet Profiles and Notebook Management

**Rationale**:
- Existing codebase already follows Domain-Driven Design with proper bounded contexts (user, pet, community, points)
- Pet personality traits logically extend the existing pet bounded context
- Notebook functionality requires new bounded context for proper separation of concerns
- Sharing system can leverage existing user management infrastructure

**Alternatives Considered**:
- Monolithic approach within existing pet context - rejected due to complexity and SRP violations
- Microservices approach - rejected as overkill for current scale and deployment complexity

### Data Storage Strategy

**Decision**: Extend Ent schema with new entities while maintaining referential integrity

**Rationale**:
- Ent ORM already proven in project with type-safe, schema-first approach
- Existing relationships (User → Pet) can be extended naturally
- Ent migrations handle schema evolution safely
- Type generation maintains compile-time safety

**Alternatives Considered**:
- Document storage (MongoDB) - rejected due to existing PostgreSQL investment
- Separate database - rejected due to transaction complexity and operational overhead

### Mobile UI Architecture

**Decision**: Follow existing React Native patterns with Redux Toolkit state management

**Rationale**:
- Consistent with existing screens (pets, groups, home)
- Redux slices already established for pets, users, groups
- React Navigation stack/tab patterns proven
- Theme system and i18n infrastructure ready

**Alternatives Considered**:
- Context API only - rejected due to complex state requirements
- MobX - rejected to maintain consistency with existing Redux approach

## Implementation Patterns

### Bounded Context Integration

**Decision**: Create `petprofiles` bounded context for personality traits, extend existing `pet` context

**Rationale**:
- Personality traits are logically separate from basic pet registration
- Allows independent evolution of personality vs basic pet data
- Maintains existing pet API contracts

**Pattern**:
```
backend/internal/
├── pet/              # Existing pet registration
├── petprofiles/      # NEW: Personality traits, extended pet info
├── notebook/         # NEW: Medical info, diet, habits, commands
└── sharing/          # NEW: Notebook access permissions
```

### API Design Strategy

**Decision**: RESTful APIs following existing patterns with resource-based URLs

**Rationale**:
- Existing endpoints follow REST conventions (`/api/pets`, `/api/groups`)
- Client already expects standard HTTP methods and status codes
- Familiar patterns reduce learning curve

**Pattern**:
```
POST   /api/pets/{id}/personality    # Add/update traits
GET    /api/pets/{id}/notebook       # Get full notebook
POST   /api/pets/{id}/notebook/medical  # Add medical entry
POST   /api/pets/{id}/notebook/share    # Grant access
DELETE /api/pets/{id}/notebook/share/{userId}  # Revoke access
```

### Mobile Screen Architecture

**Decision**: Extend existing tab navigation with notebook screens, maintain existing patterns

**Rationale**:
- Users already familiar with Pets tab navigation
- Notebook can be sub-navigation within pet details
- Maintains existing UX patterns (PetCard, ActionModal)

**Pattern**:
```
Pets Tab
├── Pet List (existing)
├── Pet Details (existing)
│   ├── Basic Info (existing)
│   ├── Personality (NEW)
│   └── Notebook (NEW)
│       ├── Medical
│       ├── Diet
│       ├── Habits
│       └── Commands
└── Shared Notebooks (NEW)
```

## Security Considerations

### Access Control Strategy

**Decision**: Role-based permissions with inheritance from existing co-ownership system

**Rationale**:
- Leverages existing pet ownership model
- Clear permission hierarchy: Owner > Co-owner > Shared User
- Maintains security boundaries established in existing system

**Permissions Matrix**:
- **Owner**: Full access, can share, can modify sharing
- **Co-owner**: Can add entries, cannot modify sharing
- **Shared User**: Read-only access to notebook

### Data Privacy

**Decision**: Explicit consent for sharing with audit logging

**Rationale**:
- Pet medical information is sensitive
- Audit trail required for accountability
- Granular permissions (per-pet, not user-wide)

## Performance Optimization

### Database Design

**Decision**: Proper indexing strategy with pagination for large notebooks

**Rationale**:
- Notebook entries will grow over time
- Medical history can be extensive
- Mobile UI requires fast loading

**Indexes**:
- `pet_id, entry_type, created_at` for filtered queries
- `user_id, shared_pet_id` for sharing lookups
- `personality_trait_type` for trait filtering

### Mobile Performance

**Decision**: Lazy loading with local caching for notebook sections

**Rationale**:
- Notebook sections can be loaded independently
- Medical images may be large
- Offline viewing important for vet visits

**Caching Strategy**:
- AsyncStorage for notebook metadata
- Image caching for medical photos
- Optimistic updates for new entries

## Testing Strategy

### Backend Testing

**Decision**: Follow existing TDD patterns with 90%+ coverage requirement

**Test Types**:
- **Domain Tests**: Business logic, validation rules
- **Application Tests**: Command/query handlers
- **Infrastructure Tests**: Repository implementations
- **HTTP Tests**: Controller endpoints
- **Architecture Tests**: Bounded context compliance

### Mobile Testing

**Decision**: Jest unit tests with integration testing for notebook flows

**Test Coverage**:
- Redux slice reducers and actions
- Component rendering and interactions
- API integration scenarios
- Navigation flows

## Migration Strategy

### Database Migration

**Decision**: Incremental Ent schema migrations with backward compatibility

**Phases**:
1. Add personality traits to existing pet schema
2. Create notebook entities with foreign keys
3. Add sharing permissions system
4. Migrate any existing pet data

### Feature Rollout

**Decision**: Progressive enhancement approach

**Phases**:
1. Backend API implementation with tests
2. Basic mobile UI for notebook creation
3. Sharing functionality
4. Advanced features (export, rich editing)

## Integration Points

### Existing System Integration

**Key Integration Points**:
- **User Authentication**: Leverage existing JWT system
- **Pet Management**: Extend existing pet entities
- **Permission System**: Build on co-ownership model
- **Mobile Navigation**: Integrate with existing tab structure
- **API Consistency**: Follow existing error handling and response patterns

### External Dependencies

**No New Dependencies Required**:
- All functionality can be implemented with existing tech stack
- Ent ORM handles database schema evolution
- React Native supports required UI patterns
- No third-party services needed for core functionality

---

**Research Status**: ✅ Complete - All technical decisions documented with rationale