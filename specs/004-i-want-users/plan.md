
# Implementation Plan: Pet Behavior Logging with Point System

**Branch**: `004-i-want-users` | **Date**: 2025-09-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-i-want-users/spec.md`

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
Pet owners need to log their pets' daily behaviors with associated point values (positive/negative) to create real-time group rankings and daily "Pet of the Day" selection. The system must support customizable daily reset times (default 9PM user timezone), predefined behavior catalogs, time-based duplicate prevention, multi-group sharing, and comprehensive data retention (6 months logs, lifetime scoring).

## Technical Context
**Language/Version**: Go 1.24+ (backend), React Native with TypeScript (mobile)
**Primary Dependencies**: Gorilla Mux, Ent ORM, PostgreSQL, Expo, Redux Toolkit
**Storage**: PostgreSQL 15 with Ent schema migrations
**Testing**: Testify (Go), Jest + React Native Testing Library (mobile) - with comprehensive test coverage and build validation
**Target Platform**: Docker containers (backend), iOS/Android via Expo
**Project Type**: mobile - determines source structure (mobile + backend API)
**Performance Goals**: <200ms API responses, real-time ranking updates, smooth mobile UX
**Constraints**: Clean Architecture compliance, 90%+ test coverage, i18n support, theme system
**Scale/Scope**: Multi-group pet communities, time-sensitive point calculations, 6-month data retention

**User Requirements Integration**: Write comprehensive Frontend/backend tests, verify builds succeed, run yarn run type-check after each development phase

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Code Quality & Architecture**: ✅ PASS - Will implement using existing DDD/Clean Architecture patterns in points bounded context, following established domain → application → infrastructure → interfaces flow

**II. Test-Driven Development**: ✅ PASS - Comprehensive test coverage required with unit tests (domain), integration tests (repositories), HTTP tests (controllers), architectural tests. User explicitly requested comprehensive frontend/backend tests

**III. User Experience First**: ✅ PASS - Mobile-first design with React Native, proper loading states, error handling, and accessibility compliance per existing patterns

**IV. Internationalization & Theming**: ✅ PASS - Must use existing translation system (t('key.path')) and theme system (theme.colors.*) with full light/dark mode support

**V. Performance & Efficiency**: ✅ PASS - <200ms API response target, real-time updates, optimized queries, proper indexing for point calculations and rankings

**VI. Error Handling & Resilience**: ✅ PASS - Structured error responses, error boundaries, network failure handling, graceful degradation

**VII. Consistency & Standardization**: ✅ PASS - Follow existing patterns (PetCard, ActionModal), consistent API structures, conventional commits, documentation updates

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

# Option 3: Mobile + API (when "iOS/Android" detected) - SELECTED
backend/
├── internal/
│   ├── points/              # New bounded context
│   │   ├── domain/          # Entities, value objects, interfaces
│   │   ├── application/     # Commands, queries, handlers
│   │   ├── infrastructure/  # Ent repositories, adapters
│   │   └── interfaces/      # HTTP controllers
│   └── shared/              # Cross-cutting concerns
└── tests/

mobile/
├── src/
│   ├── screens/behavior/    # Behavior logging screens
│   ├── components/behavior/ # Behavior-related components
│   ├── store/              # Redux state management
│   └── services/           # API integration
└── tests/
```

**Structure Decision**: Option 3 (Mobile + API) - Extends existing backend with new points bounded context, adds behavior logging screens to mobile app

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
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
