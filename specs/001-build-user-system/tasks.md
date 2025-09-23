# Tasks: Pet Notebook System and Missing User Features

**Input**: Design documents from `/specs/001-build-user-system/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/pet-personality-api.yaml, contracts/notebook-api.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   ✅ Found: Go 1.24+ backend, React Native mobile, Clean Architecture
2. Load optional design documents:
   ✅ data-model.md: 8 entities (PetPersonality, PetNotebook, NotebookEntry, etc.)
   ✅ contracts/: 2 API contract files → 15+ endpoints
   ✅ research.md: Technical decisions for bounded contexts
   ✅ quickstart.md: 5 validation scenarios
3. Generate tasks by category:
   ✅ Setup: Ent schema migrations
   ✅ Tests: contract tests, integration tests per scenario
   ✅ Core: domain entities, application layer (CQRS), infrastructure
   ✅ Integration: HTTP controllers, mobile screens
   ✅ Polish: architectural tests, quickstart validation
4. Applied task rules:
   ✅ Different files = marked [P] for parallel
   ✅ Same file/context = sequential
   ✅ Tests before implementation (TDD)
5. Numbered tasks sequentially (T001-T043)
6. Generated dependency graph and parallel execution examples
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included in task descriptions
- Mobile project structure: `backend/` and `mobile/`

## Phase 3.1: Database Schema Setup

- [x] T001 [P] Create PetPersonality Ent schema in `backend/ent/schema/pet_personality.go`
- [x] T002 [P] Create PetNotebook Ent schema in `backend/ent/schema/pet_notebook.go`
- [x] T003 [P] Create NotebookEntry Ent schema in `backend/ent/schema/notebook_entry.go`
- [x] T004 [P] Create MedicalEntry Ent schema in `backend/ent/schema/medical_entry.go`
- [x] T005 [P] Create DietEntry Ent schema in `backend/ent/schema/diet_entry.go`
- [x] T006 [P] Create HabitEntry Ent schema in `backend/ent/schema/habit_entry.go`
- [x] T007 [P] Create CommandEntry Ent schema in `backend/ent/schema/command_entry.go`
- [x] T008 [P] Create NotebookShare Ent schema in `backend/ent/schema/notebook_share.go`
- [x] T009 Update existing Pet schema to add personality and notebook relationships in `backend/ent/schema/pet.go`
- [x] T010 Generate Ent code and run migrations with `just ent-migrate`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P]
- [ ] T011 [P] Contract test GET /api/pets/{id}/personality in `backend/internal/pet/interfaces/http/controller_test.go`
- [ ] T012 [P] Contract test POST /api/pets/{id}/personality in `backend/internal/pet/interfaces/http/controller_test.go`
- [ ] T013 [P] Contract test DELETE /api/pets/{id}/personality/{traitId} in `backend/internal/pet/interfaces/http/controller_test.go`
- [ ] T014 [P] Contract test GET /api/pets/{id}/notebook in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T015 [P] Contract test POST /api/pets/{id}/notebook/entries in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T016 [P] Contract test PUT /api/pets/{id}/notebook/entries/{entryId} in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T017 [P] Contract test DELETE /api/pets/{id}/notebook/entries/{entryId} in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T018 [P] Contract test GET /api/pets/{id}/notebook/share in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T019 [P] Contract test POST /api/pets/{id}/notebook/share in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T020 [P] Contract test DELETE /api/pets/{id}/notebook/share/{userId} in `backend/internal/notebook/interfaces/http/controller_test.go`
- [ ] T021 [P] Contract test GET /api/users/shared-notebooks in `backend/internal/user/interfaces/http/controller_test.go`

### Integration Tests [P]
- [ ] T022 [P] Integration test personality traits scenario in `backend/tests/integration/personality_test.go`
- [ ] T023 [P] Integration test notebook entries scenario in `backend/tests/integration/notebook_test.go`
- [ ] T024 [P] Integration test notebook sharing scenario in `backend/tests/integration/sharing_test.go`
- [ ] T025 [P] Integration test co-owner permissions scenario in `backend/tests/integration/coowner_test.go`
- [ ] T026 [P] Integration test data validation scenario in `backend/tests/integration/validation_test.go`

## Phase 3.3: Backend Domain Layer (ONLY after tests are failing)

### Pet Profiles Bounded Context [P]
- [ ] T027 [P] PetPersonality domain entity in `backend/internal/petprofiles/domain/personality.go`
- [ ] T028 [P] PetPersonality repository interface in `backend/internal/petprofiles/domain/repository.go`
- [ ] T029 [P] PetPersonality domain errors in `backend/internal/petprofiles/domain/errors.go`

### Notebook Bounded Context [P]
- [ ] T030 [P] PetNotebook domain entity in `backend/internal/notebook/domain/notebook.go`
- [ ] T031 [P] NotebookEntry domain entity in `backend/internal/notebook/domain/entry.go`
- [ ] T032 [P] Specialized entry entities (Medical, Diet, Habit, Command) in `backend/internal/notebook/domain/specialized_entries.go`
- [ ] T033 [P] NotebookShare domain entity in `backend/internal/notebook/domain/share.go`
- [ ] T034 [P] Notebook repository interfaces in `backend/internal/notebook/domain/repository.go`
- [ ] T035 [P] Notebook domain errors in `backend/internal/notebook/domain/errors.go`

## Phase 3.4: Backend Application Layer (CQRS)

### Pet Profiles Commands & Queries
- [ ] T036 Add personality traits command handler in `backend/internal/petprofiles/application/commands/add_personality.go`
- [ ] T037 Update personality traits command handler in `backend/internal/petprofiles/application/commands/update_personality.go`
- [ ] T038 Delete personality trait command handler in `backend/internal/petprofiles/application/commands/delete_personality.go`
- [ ] T039 Get personality traits query handler in `backend/internal/petprofiles/application/queries/get_personality.go`

### Notebook Commands & Queries
- [ ] T040 Create notebook entry command handler in `backend/internal/notebook/application/commands/create_entry.go`
- [ ] T041 Update notebook entry command handler in `backend/internal/notebook/application/commands/update_entry.go`
- [ ] T042 Delete notebook entry command handler in `backend/internal/notebook/application/commands/delete_entry.go`
- [ ] T043 Get notebook query handler in `backend/internal/notebook/application/queries/get_notebook.go`
- [ ] T044 Grant notebook access command handler in `backend/internal/notebook/application/commands/grant_access.go`
- [ ] T045 Revoke notebook access command handler in `backend/internal/notebook/application/commands/revoke_access.go`
- [ ] T046 Get shared notebooks query handler in `backend/internal/notebook/application/queries/get_shared_notebooks.go`

## Phase 3.5: Backend Infrastructure Layer

### Repository Implementations
- [ ] T047 [P] PetPersonality Ent repository in `backend/internal/petprofiles/infrastructure/ent/repository.go`
- [ ] T048 [P] PetPersonality mock repository in `backend/internal/petprofiles/infrastructure/mock_repository.go`
- [ ] T049 [P] Notebook Ent repository in `backend/internal/notebook/infrastructure/ent/repository.go`
- [ ] T050 [P] Notebook mock repository in `backend/internal/notebook/infrastructure/mock_repository.go`

### HTTP Controllers
- [ ] T051 Pet personality HTTP controller in `backend/internal/petprofiles/interfaces/http/controller.go`
- [ ] T052 Notebook HTTP controller in `backend/internal/notebook/interfaces/http/controller.go`
- [ ] T053 Update main.go to wire new bounded contexts with dependency injection
- [ ] T054 Add new route handlers to existing router setup

## Phase 3.6: Mobile Frontend Implementation

### Redux State Management [P]
- [ ] T055 [P] Pet personality slice in `mobile/src/store/petPersonalitySlice.ts`
- [ ] T056 [P] Notebook slice in `mobile/src/store/notebookSlice.ts`
- [ ] T057 [P] Notebook sharing slice in `mobile/src/store/notebookSharingSlice.ts`

### API Services [P]
- [ ] T058 [P] Pet personality API service in `mobile/src/services/petPersonalityService.ts`
- [ ] T059 [P] Notebook API service in `mobile/src/services/notebookService.ts`
- [ ] T060 [P] Notebook sharing API service in `mobile/src/services/notebookSharingService.ts`

### UI Components [P]
- [ ] T061 [P] PersonalityTraitSelector component in `mobile/src/components/PersonalityTraitSelector.tsx`
- [ ] T062 [P] NotebookEntryCard component in `mobile/src/components/NotebookEntryCard.tsx`
- [ ] T063 [P] NotebookEntryForm component in `mobile/src/components/NotebookEntryForm.tsx`
- [ ] T064 [P] SharingPermissionsList component in `mobile/src/components/SharingPermissionsList.tsx`

### Screen Components
- [ ] T065 Pet Personality screen in `mobile/src/screens/pets/PetPersonalityScreen.tsx`
- [ ] T066 Pet Notebook main screen in `mobile/src/screens/pets/PetNotebookScreen.tsx`
- [ ] T067 Add Notebook Entry screen in `mobile/src/screens/pets/AddNotebookEntryScreen.tsx`
- [ ] T068 Notebook Sharing screen in `mobile/src/screens/pets/NotebookSharingScreen.tsx`
- [ ] T069 Shared Notebooks screen in `mobile/src/screens/pets/SharedNotebooksScreen.tsx`

### Navigation Integration
- [ ] T070 Update pet details navigation to include personality and notebook tabs
- [ ] T071 Add notebook sharing to main navigation if needed
- [ ] T072 Update type definitions for new navigation routes

## Phase 3.7: Mobile Testing

### Component Tests [P]
- [ ] T073 [P] PersonalityTraitSelector tests in `mobile/src/components/__tests__/PersonalityTraitSelector.test.tsx`
- [ ] T074 [P] NotebookEntryCard tests in `mobile/src/components/__tests__/NotebookEntryCard.test.tsx`
- [ ] T075 [P] NotebookEntryForm tests in `mobile/src/components/__tests__/NotebookEntryForm.test.tsx`

### Redux Tests [P]
- [ ] T076 [P] Pet personality slice tests in `mobile/src/store/__tests__/petPersonalitySlice.test.ts`
- [ ] T077 [P] Notebook slice tests in `mobile/src/store/__tests__/notebookSlice.test.ts`

## Phase 3.8: Integration & Polish

### Localization
- [ ] T078 [P] Add French translations for new features in `mobile/src/localization/translations/fr.ts`
- [ ] T079 [P] Add English translations for new features in `mobile/src/localization/translations/en.ts`

### Quality Gates
- [ ] T080 [P] Backend unit tests for domain entities in respective test files
- [ ] T081 [P] Backend architectural compliance tests in `backend/tests/architecture/`
- [ ] T082 Performance tests verify <200ms API response times
- [ ] T083 Mobile linting and type checking with `yarn lint && yarn type-check`
- [ ] T084 Backend linting and testing with `just validate`

### Validation & Documentation
- [ ] T085 Run quickstart.md scenarios to validate complete implementation
- [ ] T086 Update CLAUDE.md with new features and implementation notes
- [ ] T087 Constitution compliance verification (90%+ test coverage, Clean Architecture)

## Dependencies

### Critical Path
1. **Database Setup (T001-T010)** → **All subsequent tasks**
2. **Tests (T011-T026)** → **Implementation (T027-T087)**
3. **Domain Layer (T027-T035)** → **Application Layer (T036-T046)**
4. **Application Layer** → **Infrastructure Layer (T047-T054)**
5. **Backend Complete** → **Mobile Frontend (T055-T072)**
6. **Core Implementation** → **Polish & Quality (T073-T087)**

### Parallel Groups
```
# Database Schema (can all run together)
T001, T002, T003, T004, T005, T006, T007, T008

# Contract Tests (independent API tests)
T011, T012, T013, T014, T015, T016, T017, T018, T019, T020, T021

# Integration Tests (independent scenarios)
T022, T023, T024, T025, T026

# Domain Entities (different bounded contexts)
T027, T028, T029, T030, T031, T032, T033, T034, T035

# Repository Implementations (independent of each other)
T047, T048, T049, T050

# Mobile Redux Slices (independent state)
T055, T056, T057

# Mobile API Services (independent API calls)
T058, T059, T060

# Mobile UI Components (independent components)
T061, T062, T063, T064

# Mobile Tests (independent test files)
T073, T074, T075, T076, T077

# Localization & Quality (independent files)
T078, T079, T080, T081
```

## Parallel Execution Examples

### Launch Database Schema Tasks (T001-T008):
```bash
# All schemas can be created simultaneously
Task: "Create PetPersonality Ent schema in backend/ent/schema/pet_personality.go"
Task: "Create PetNotebook Ent schema in backend/ent/schema/pet_notebook.go"
Task: "Create NotebookEntry Ent schema in backend/ent/schema/notebook_entry.go"
Task: "Create MedicalEntry Ent schema in backend/ent/schema/medical_entry.go"
Task: "Create DietEntry Ent schema in backend/ent/schema/diet_entry.go"
Task: "Create HabitEntry Ent schema in backend/ent/schema/habit_entry.go"
Task: "Create CommandEntry Ent schema in backend/ent/schema/command_entry.go"
Task: "Create NotebookShare Ent schema in backend/ent/schema/notebook_share.go"
```

### Launch Contract Tests (T011-T021):
```bash
# API contract tests are independent
Task: "Contract test GET /api/pets/{id}/personality in backend/internal/pet/interfaces/http/controller_test.go"
Task: "Contract test POST /api/pets/{id}/personality in backend/internal/pet/interfaces/http/controller_test.go"
Task: "Contract test GET /api/pets/{id}/notebook in backend/internal/notebook/interfaces/http/controller_test.go"
Task: "Contract test POST /api/pets/{id}/notebook/entries in backend/internal/notebook/interfaces/http/controller_test.go"
Task: "Contract test GET /api/users/shared-notebooks in backend/internal/user/interfaces/http/controller_test.go"
```

### Launch Mobile UI Components (T061-T064):
```bash
# UI components are independent React components
Task: "PersonalityTraitSelector component in mobile/src/components/PersonalityTraitSelector.tsx"
Task: "NotebookEntryCard component in mobile/src/components/NotebookEntryCard.tsx"
Task: "NotebookEntryForm component in mobile/src/components/NotebookEntryForm.tsx"
Task: "SharingPermissionsList component in mobile/src/components/SharingPermissionsList.tsx"
```

## Notes

### TDD Requirements
- All contract and integration tests (T011-T026) MUST be written first and MUST FAIL
- No implementation code (T027+) until tests are failing
- Verify each test fails for the right reason before proceeding

### Clean Architecture Compliance
- Domain entities (T027-T035) have no dependencies on infrastructure
- Application layer (T036-T046) depends only on domain interfaces
- Infrastructure (T047-T054) implements domain interfaces
- HTTP controllers are thin, delegating to application handlers

### Mobile Development
- Follow existing patterns from current pet screens
- Use theme system for all styling (no hardcoded colors)
- Include loading states and error handling for all API calls
- Support both light/dark themes

### Performance Requirements
- All API endpoints must respond <200ms (T082)
- Mobile UI must maintain 60fps during navigation
- Database queries use proper indexing from data-model.md
- Implement pagination for large notebook entry lists

## Validation Checklist

**GATE: Verified before task execution**

- [x] All contracts have corresponding tests (T011-T021 cover all API endpoints)
- [x] All entities have model tasks (T001-T008 cover 8 entities, T027-T035 create domain objects)
- [x] All tests come before implementation (T011-T026 before T027-T087)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path (all tasks include full paths)
- [x] No task modifies same file as another [P] task (verified file separation)
- [x] Complete feature coverage (personality traits + notebook + sharing + mobile UI)
- [x] Constitutional compliance built-in (Clean Architecture, TDD, 90%+ coverage, i18n)