<!--
Sync Impact Report:
Version change: Initial → 1.0.0
Added sections:
- Core Principles (7 principles covering quality, architecture, testing, UX, performance, consistency, error handling)
- Frontend Standards (mobile-specific guidelines)
- Quality Gates (enforcement mechanisms)
- Governance (amendment and compliance procedures)
Templates requiring updates:
- ✅ spec-template.md (reviewed - aligns with quality requirements)
- ✅ plan-template.md (reviewed - aligns with research and structure requirements)
- ✅ tasks-template.md (updated with constitution compliance verification)
Follow-up TODOs: None - all placeholders filled
-->

# Pet of the Day Constitution

## Core Principles

### I. Code Quality & Architecture (NON-NEGOTIABLE)
All code MUST follow SOLID principles, Domain-Driven Design (DDD), and Clean Architecture patterns. Backend bounded contexts MUST maintain strict separation with dependency inversion (domain → application → infrastructure → interfaces). Cross-context communication MUST occur only through domain/application layers. Every feature MUST start with domain modeling and interface definition before implementation.

**Rationale**: Ensures maintainable, testable, and scalable codebase that can evolve without architectural debt.

### II. Test-Driven Development (NON-NEGOTIABLE)
Every implementation MUST have comprehensive test coverage with minimum 90% coverage for domain and application layers. Tests MUST be written before implementation (Red-Green-Refactor). All bounded contexts MUST include unit tests (domain logic), integration tests (repositories), HTTP tests (controllers), and architectural compliance tests.

**Rationale**: Prevents regressions, enables confident refactoring, and validates business logic correctness.

### III. User Experience First
Mobile application MUST prioritize user experience with responsive design, intuitive navigation, proper loading states, meaningful error messages, and accessibility compliance. All interactions MUST provide immediate feedback. iOS and Android compatibility MUST be 100% with platform-specific optimizations where necessary.

**Rationale**: Mobile users expect native-quality experiences; poor UX leads to app abandonment.

### IV. Internationalization & Theming (NON-NEGOTIABLE)
All user-facing text MUST use translation keys (t('key.path')) with support for French and English. All styling MUST use theme system (theme.colors.*, theme.spacing.*) with full light/dark mode support. No hardcoded colors, fonts, or text strings are permitted in components.

**Rationale**: Ensures global accessibility and consistent visual identity across all user preferences.

### V. Performance & Efficiency
All API endpoints MUST respond within 200ms for simple queries, 500ms for complex operations. Database queries MUST be optimized with proper indexing and pagination. Frontend components MUST implement lazy loading, memoization, and virtual scrolling where appropriate. Memory leaks and performance bottlenecks MUST be identified and resolved.

**Rationale**: Poor performance directly impacts user satisfaction and app store ratings.

### VI. Error Handling & Resilience
All functions MUST handle error cases explicitly with typed error responses. API responses MUST include structured error messages with actionable guidance. Frontend MUST implement error boundaries, retry mechanisms, and graceful degradation. Network failures MUST never crash the application.

**Rationale**: Robust error handling prevents user frustration and improves app reliability.

### VII. Consistency & Standardization
Code style, naming conventions, component patterns, and API structures MUST be consistent across all bounded contexts. Shared components MUST be reusable and follow established patterns (PetCard, ActionModal, etc.). Git commit messages MUST follow conventional commit format. Documentation MUST be updated with every feature change.

**Rationale**: Consistency reduces cognitive load, improves team velocity, and simplifies maintenance.

## Frontend Standards

### Mobile Development Requirements
- **React Native + TypeScript**: Mandatory for type safety and development velocity
- **Expo Framework**: Required for cross-platform compatibility and deployment simplicity
- **Redux Toolkit**: State management with proper async thunk patterns
- **React Navigation**: Navigation with type-safe routing
- **React Hook Form + Yup**: Form validation with consistent error handling
- **React Query**: API caching and synchronization

### Component Architecture
- **Atomic Design**: Organize components as atoms, molecules, organisms, templates, pages
- **Theme Provider**: Global theme context with dark/light mode switching
- **Translation Provider**: i18n context with language switching capability
- **Error Boundaries**: Wrap all route components with error recovery
- **Loading States**: Skeleton screens for all async data loading

### Platform Compatibility
- **iOS Guidelines**: Follow Human Interface Guidelines for navigation, gestures, and visual design
- **Android Guidelines**: Adhere to Material Design principles for component behavior
- **Safe Areas**: Proper handling of notches, navigation bars, and status bars
- **Permissions**: Graceful handling of camera, location, and notification permissions
- **Offline Support**: Essential features MUST work without network connectivity

## Quality Gates

### Pre-Commit Requirements
- **Linting**: ESLint (frontend) and golangci-lint (backend) MUST pass without warnings
- **Type Checking**: TypeScript compilation MUST succeed without errors
- **Formatting**: Prettier (frontend) and gofmt (backend) MUST be applied
- **Tests**: All existing tests MUST pass; new code MUST include tests

### Pull Request Requirements
- **Architecture Review**: Verify Clean Architecture compliance and bounded context isolation
- **Test Coverage**: Minimum 90% coverage for new code with meaningful test scenarios
- **Documentation**: README updates for new features, API documentation for endpoints
- **Performance**: No performance regressions measured via benchmarks
- **Security**: Vulnerability scans MUST pass; secrets MUST NOT be committed

### Release Requirements
- **Integration Tests**: Full end-to-end test suite MUST pass on target platforms
- **Performance Benchmarks**: API response times and mobile app startup time within targets
- **Accessibility Audit**: Screen reader compatibility and color contrast validation
- **Security Scan**: Dependency vulnerabilities addressed and code security reviewed

## Governance

### Amendment Procedure
Constitution changes require approval through pull request review with architectural impact assessment. MAJOR version increments for principle removals or redefinitions; MINOR for new principles or expanded guidance; PATCH for clarifications and refinements.

### Compliance Review
All pull requests MUST verify constitutional compliance. Complex changes MUST include architectural decision records (ADRs). Team leads MUST review deviations and approve any temporary exceptions with remediation timelines.

### Enforcement
Automated tools MUST enforce linting, formatting, and test coverage requirements. Code review checklists MUST verify principle adherence. Regular architecture reviews MUST validate ongoing compliance and identify technical debt.

**Version**: 1.0.0 | **Ratified**: 2025-01-23 | **Last Amended**: 2025-01-23