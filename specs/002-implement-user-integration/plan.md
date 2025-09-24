
# Implementation Plan: User Integration System

**Branch**: `002-implement-user-integration` | **Date**: 2025-09-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-implement-user-integration/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement a comprehensive user integration system that replaces the existing frontend with a new implementation supporting user accounts, multi-pet registration with ownership models, co-owner relationships, comprehensive pet notebook system with medical/diet/habits/commands tracking, and secure notebook sharing functionality. The system will maintain the existing Go backend architecture while completely redesigning the mobile frontend to support the expanded user and pet management requirements.

## Technical Context
**Language/Version**: Go 1.25 (backend), React Native 0.81.4 + TypeScript ~5.9.2 (mobile)
**Primary Dependencies**: Ent ORM, Gorilla Mux, JWT (backend); Expo SDK 54, Redux Toolkit, React Navigation, React Hook Form + Yup (mobile)
**Storage**: PostgreSQL 15 with Ent ORM for schema management
**Testing**: Testify (Go backend), Jest + React Testing Library (mobile frontend)
**Target Platform**: Docker containers (backend), iOS/Android via Expo (mobile)
**Project Type**: mobile - React Native app + Go API backend
**Performance Goals**: <200ms API response times for simple queries, <500ms for complex operations, 60fps mobile UI
**Constraints**: Complete frontend replacement, maintain existing backend architecture, offline-capable mobile app, <15MB photo uploads
**Scale/Scope**: Multi-user system with notebook sharing, complete CRUD for users/pets/notebooks, comprehensive relationship management

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality & Architecture**: ✅ PASS - Will follow existing DDD/Clean Architecture with proper bounded contexts (user, pet, community, points) and dependency inversion

**Test-Driven Development**: ✅ PASS - Will implement comprehensive test coverage (>90% for domain/application layers) with unit, integration, and HTTP tests

**User Experience First**: ✅ PASS - Mobile-first approach with responsive design, proper loading states, error handling, and iOS/Android compatibility via Expo

**Internationalization & Theming**: ✅ PASS - Will use existing i18n system (French/English) and theme system (light/dark mode) with no hardcoded strings or colors

**Performance & Efficiency**: ✅ PASS - API endpoints <200ms simple/<500ms complex, optimized database queries with Ent ORM, proper pagination and caching

**Error Handling & Resilience**: ✅ PASS - Structured error responses, error boundaries, retry mechanisms, graceful degradation for network failures

**Consistency & Standardization**: ✅ PASS - Will follow existing patterns (Redux Toolkit, React Navigation, component reuse), conventional commits, updated documentation

**Initial Assessment**: All constitutional principles align with feature requirements. No violations detected.

**Post-Design Re-evaluation**:
- ✅ **Architecture Compliance**: Data model and contracts follow Clean Architecture with proper bounded context separation (user, pet, notebook, sharing)
- ✅ **API Design**: RESTful endpoints in OpenAPI spec follow existing patterns with proper error handling
- ✅ **Testing Strategy**: Contract tests generated for all endpoints, comprehensive test scenarios in quickstart.md
- ✅ **Mobile Architecture**: React Native components follow atomic design principles with proper state management
- ✅ **Performance Design**: Database indexes planned, pagination implemented, image optimization strategy defined
- ✅ **Security Design**: Role-based access control, input validation, secure file uploads, JWT token management
- ✅ **i18n/Theme Ready**: Design leverages existing translation and theme systems

**Final Assessment**: Design fully compliant with all constitutional principles. No violations or exceptions needed.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 3 (Mobile + API) - Project has separate backend/ and mobile/ directories with Go API and React Native Expo app

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Backend tasks: Each entity from data-model.md → Ent schema + repository tasks
- API tasks: Each endpoint from api-spec.yaml → controller + HTTP test tasks
- Frontend tasks: Each screen from user stories → component + integration test tasks
- Contract tasks: Each test file in contracts/ → failing test task [P]

**Specific Task Categories**:
1. **Database Schema Tasks**: Create Ent schemas for PetPersonality, NotebookEntry, MedicalEntry, etc.
2. **Repository Tasks**: Implement repository patterns for each new bounded context
3. **API Controller Tasks**: Create HTTP controllers for personality, notebook, sharing endpoints
4. **Mobile Screen Tasks**: Build registration, pet management, notebook, sharing screens
5. **Component Tasks**: Personality trait selector, notebook entry forms, sharing modals
6. **Integration Tasks**: End-to-end user story validation

**Ordering Strategy**:
- TDD order: Contract tests → Entity schemas → Repositories → Controllers → Frontend components
- Dependency order: Database → Backend services → API endpoints → Mobile screens
- Bounded context isolation: Complete user context, then pet context, then notebook context
- Mark [P] for parallel execution within same layer (e.g., multiple entity schemas)

**Expected Task Breakdown**:
- Setup & Schema tasks: 14 tasks
- Contract Tests: 10 tasks
- Backend Implementation: 34 tasks
- Mobile Implementation: 42 tasks
- Integration & Testing: 14 tasks
- Polish & Quality: 17 tasks
- **Total Estimated**: 131 numbered, dependency-ordered tasks in tasks.md

**Constitutional Compliance Integration**:
- Each task will include constitutional requirements verification
- Test coverage requirements embedded in implementation tasks
- Performance benchmarks included in validation tasks
- Security validation integrated into auth-related tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md generated
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md exists
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - All principles align with requirements
- [x] Post-Design Constitution Check: PASS - Design fully compliant
- [x] All NEEDS CLARIFICATION resolved - Feature spec has comprehensive clarifications
- [x] Complexity deviations documented - No deviations needed

**Artifacts Generated**:
- [x] plan.md - This implementation plan document
- [x] research.md - Technology stack and architecture decisions
- [x] data-model.md - Complete entity relationship design
- [x] contracts/api-spec.yaml - OpenAPI specification for all endpoints
- [x] contracts/*_test.go - Contract test files for all API endpoints
- [x] quickstart.md - User story validation scenarios
- [x] tasks.md - Complete implementation task breakdown
- [x] CLAUDE.md - Updated agent context with current feature info

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
