# Tasks: UI/UX Fixes and Mobile App Improvements

**Input**: Design documents from `/specs/003-ui-ux-fixes/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: React Native, TypeScript, Expo, Redux Toolkit
   → Project structure: mobile app (mobile/) with Go backend
2. Load design documents:
   → data-model.md: UI state entities for navigation, invitations, profile
   → contracts/: UI state management interfaces
   → research.md: Navigation consolidation, TypeScript strategy
   → quickstart.md: 8 validation scenarios for testing
3. Generate tasks by category:
   → Setup: TypeScript compliance, navigation consolidation
   → Tests: Component tests for fixed functionality
   → Core: Fix broken navigation, restore pet detail features
   → Integration: Translation updates, theme compliance
   → Polish: Layout improvements, empty states
4. Apply task rules:
   → Different components = mark [P] for parallel
   → Same component = sequential (no [P])
   → TypeScript fixes before functionality fixes
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph with TypeScript → Navigation → Features
7. SUCCESS (39 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Mobile app**: `mobile/src/` for source code
- **Tests**: `mobile/src/__tests__/` for test files
- **Types**: `mobile/src/types/` for TypeScript definitions

## Phase 3.1: Foundation & Setup
- [x] T001 Run TypeScript compiler diagnostics to identify all 120+ compilation errors in mobile/
- [x] T002 [P] Fix TypeScript errors in mobile/src/__tests__/ test files (compilation blockers)
- [x] T003 [P] Fix missing type imports in mobile/src/types/ directory
- [x] T004 [P] Fix API response type mismatches in mobile/src/services/
- [x] T005 [P] Fix Redux async thunk type errors in mobile/src/store/
- [x] T006 Consolidate navigation by removing duplicate TabNavigator.tsx, keep MainNavigator.tsx
- [x] T007 [P] Standardize import paths to use @/ aliases throughout mobile/src/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T008 [P] Component test for InvitationManager in mobile/src/__tests__/components/InvitationManager.test.tsx
- [x] T009 [P] Component test for PetDetailScreen sections in mobile/src/__tests__/screens/PetDetailScreen.test.tsx
- [x] T010 [P] Component test for ProfileEditScreen in mobile/src/__tests__/screens/ProfileEditScreen.test.tsx
- [x] T011 [P] Navigation test for broken button flows in mobile/src/__tests__/navigation/NavigationFlow.test.tsx
- [x] T012 [P] Translation coverage test in mobile/src/__tests__/localization/TranslationCoverage.test.tsx
- [x] T013 [P] Layout centering test for MyPets section in mobile/src/__tests__/screens/HomeScreen.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Navigation Fixes
- [x] T014 Fix Add Pet button navigation in mobile/src/screens/home/HomeScreen.tsx
- [x] T015 Fix View All Pets navigation in mobile/src/screens/pets/MyPetsScreen.tsx
- [x] T016 Fix pet detail navigation from pet cards in mobile/src/shared/cards/PetCard.tsx
- [x] T017 Fix system back button behavior in mobile/src/navigation/MainNavigator.tsx

### Pet Detail Screen Restoration
- [x] T018 Add Notes section component in mobile/src/screens/pets/components/NotesSection.tsx
- [x] T019 Add Co-owners section component in mobile/src/screens/pets/components/CoOwnersSection.tsx
- [x] T020 Add Personality section component in mobile/src/screens/pets/components/PersonalitySection.tsx
- [x] T021 Integrate all sections into PetDetailScreen in mobile/src/screens/pets/PetDetailScreen.tsx
- [x] T022 Fix pet deletion with confirmation dialog in mobile/src/screens/pets/PetDetailScreen.tsx
- [x] T023 Fix notes deletion functionality in mobile/src/screens/pets/components/NotesSection.tsx

### Invitation Management Implementation
- [x] T024 Create InvitationInterface component in mobile/src/components/invitations/InvitationInterface.tsx
- [x] T025 Add accept invitation functionality with API integration in mobile/src/store/groupSlice.ts
- [x] T026 Add decline invitation functionality with confirmation in mobile/src/store/groupSlice.ts
- [x] T027 Add dismiss invitation UI functionality in mobile/src/components/invitations/InvitationInterface.tsx

## Phase 3.4: Integration & State Management

### Profile Management
- [x] T028 Add profile editing functionality in mobile/src/screens/profile/ProfileEditScreen.tsx
- [x] T029 Remove pet information from profile screen in mobile/src/screens/profile/ProfileScreen.tsx
- [x] T030 Add real-time points display updates in mobile/src/screens/profile/ProfileScreen.tsx
- [x] T031 Remove Edit Profile button from settings in mobile/src/screens/settings/SettingsScreen.tsx

### Group Management
- [x] T032 Add group removal functionality in mobile/src/screens/groups/GroupsScreen.tsx
- [x] T033 Create empty state component for leaderboards in mobile/src/components/EmptyStateManager.tsx
- [x] T034 Integrate empty states in leaderboard screens in mobile/src/screens/groups/LeaderboardScreen.tsx

## Phase 3.5: Polish & Quality Gates

### Translation & Localization
- [x] T035 [P] Audit and complete missing French translations in mobile/src/localization/translations/fr.json
- [x] T036 [P] Add missing profile section translations in mobile/src/localization/translations/fr.json
- [x] T037 [P] Verify translation consistency across all screens in mobile/src/localization/

### Layout & Visual Improvements
- [x] T038 [P] Fix MyPets section centering in mobile/src/screens/home/HomeScreen.tsx
- [x] T039 [P] Redesign PetDetailScreen for improved usability in mobile/src/screens/pets/PetDetailScreen.tsx

## Dependencies
- TypeScript fixes (T001-T007) before all other development
- Navigation consolidation (T006) before navigation fixes (T014-T017)
- Tests (T008-T013) before implementation (T014-T039)
- Pet detail components (T018-T020) before integration (T021)
- Core functionality before UI polish (T035-T039)

## Parallel Example
```bash
# After TypeScript fixes, launch navigation tests together:
Task: "Component test for InvitationManager in mobile/src/__tests__/components/InvitationManager.test.tsx"
Task: "Component test for PetDetailScreen sections in mobile/src/__tests__/screens/PetDetailScreen.test.tsx"
Task: "Component test for ProfileEditScreen in mobile/src/__tests__/screens/ProfileEditScreen.test.tsx"
Task: "Navigation test for broken button flows in mobile/src/__tests__/navigation/NavigationFlow.test.tsx"
```

```bash
# Launch translation and layout fixes together:
Task: "Audit and complete missing French translations in mobile/src/localization/translations/fr.json"
Task: "Fix MyPets section centering in mobile/src/screens/home/HomeScreen.tsx"
Task: "Redesign PetDetailScreen for improved usability in mobile/src/screens/pets/PetDetailScreen.tsx"
```

## Critical Path
1. **Foundation** (T001-T007): TypeScript compliance enables all development
2. **Navigation Core** (T006, T014-T017): Basic app navigation must work
3. **Feature Restoration** (T018-T027): Core pet and invitation functionality
4. **User Experience** (T028-T034): Profile and group management
5. **Polish** (T035-T039): Translations and visual improvements

## Validation Scenarios (from quickstart.md)
Each major phase should be validated against these scenarios:
1. TypeScript compilation (T001-T007) → `yarn type-check` passes
2. Navigation functionality (T014-T017) → All buttons and navigation work
3. Invitation management (T024-T027) → Accept/decline/dismiss flow works
4. Pet detail functionality (T018-T023) → Notes, co-owners, personality sections
5. French translation (T035-T037) → Complete localization coverage
6. Layout fixes (T038-T039) → Proper centering and visual design
7. Profile management (T028-T031) → Edit user info, point updates
8. Group management (T032-T034) → Remove groups, empty state handling

## Task Generation Rules Applied
1. **From Contracts**: UI state interfaces → component tests and implementations
2. **From Data Model**: NavigationState, InvitationInterface, etc. → state management tasks
3. **From Quickstart**: 8 test scenarios → validation tasks throughout
4. **From Research**: TypeScript strategy, navigation consolidation → foundation tasks

## Validation Checklist
- [x] All UI contracts have corresponding component tests
- [x] All data model entities have implementation tasks
- [x] All tests come before implementation (TDD approach)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Critical path dependencies clearly defined
- [x] Quickstart validation scenarios integrated throughout

## Notes
- TypeScript fixes (T001-T007) are mandatory first phase - nothing else can proceed until complete
- [P] tasks are different components/files with no shared dependencies
- Verify tests fail before implementing functionality
- Test after each major phase using quickstart.md scenarios
- Focus on user experience improvements over architectural changes
- Maintain existing Redux store structure and API integration patterns