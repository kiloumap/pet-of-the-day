# Frontend Test Suite

This directory contains comprehensive tests for the Pet of the Day mobile application. The test suite covers all major functionality and ensures regression prevention for future development.

## Test Structure

```
src/__tests__/
├── components/           # Component tests
├── screens/             # Screen tests
├── services/            # API service tests
├── store/               # Redux store tests
├── utils/               # Utility function tests
├── integration/         # Integration tests
├── setup/               # Test configuration
├── jest.config.js       # Jest configuration
└── README.md           # This file
```

## Test Categories

### 1. Service Tests (`services/`)
- **apiService.test.ts**: Comprehensive API service testing
  - Token management (storage, retrieval, clearing)
  - Error handling (standardized API errors, validation errors, network errors)
  - Pet operations (CRUD operations with proper data transformation)
  - Group operations (creation, member management, authorization)
  - Points system (behaviors, score events, leaderboards)

### 2. Store Tests (`store/`)
- **groupSlice.test.ts**: Redux group state management
  - Async thunks (fetchUserGroups, createGroup, joinGroup, etc.)
  - State updates and error handling
  - Auto-join functionality for group creators
  - Membership management
- **petSlice.test.ts**: Redux pet state management
  - Pet CRUD operations
  - Selectors (pets list, today's winner)
  - Error handling and loading states

### 3. Component Tests (`components/`)
- **ActivityFeed.test.tsx**: Activity feed component
  - Empty state rendering
  - Activity item display
  - Refresh functionality
  - Time formatting and icon selection
  - Performance and accessibility

### 4. Screen Tests (`screens/`)
- **CreateGroupScreen.test.tsx**: Group creation workflow
  - Form validation and submission
  - Success modal and navigation
  - Error handling and recovery
  - Privacy settings and accessibility
- **AddActionScreen.test.tsx**: Score event creation
  - Pet and behavior selection
  - Form validation and filtering
  - Species-based behavior loading
  - Success flow and error handling

### 5. Utility Tests (`utils/`)
- **debugAuth.test.ts**: Authentication debugging utility
  - Token state analysis
  - API service integration
  - Error scenarios and malformed data
  - Auth flow debugging support

### 6. Integration Tests (`integration/`)
- **authFlow.test.ts**: End-to-end authentication testing
  - Registration and login flows
  - Token persistence and state management
  - Logout and data clearing
  - Error recovery and concurrent operations

## Running Tests

### All Tests
```bash
yarn test
```

### Specific Test Suites
```bash
# Service tests
yarn test services

# Store tests
yarn test store

# Component tests
yarn test components

# Screen tests
yarn test screens

# Integration tests
yarn test integration
```

### With Coverage
```bash
yarn test:coverage
```

### Watch Mode
```bash
yarn test --watch
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- React Native preset with proper transformations
- Mock setup for React Navigation, AsyncStorage, and native modules
- Coverage thresholds (80% across all metrics)
- Module path mapping and ignore patterns

### Test Setup (`setup/testSetup.js`)
- Mock implementations for React Native modules
- Navigation and gesture handler mocks
- Icon and UI component mocks
- Global test utilities and environment setup

## Coverage Targets

The test suite maintains 80% coverage across:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Mock Strategy

### API Services
- Complete mock implementations with realistic responses
- Error simulation for various failure scenarios
- Async operation testing with proper timing

### React Native Modules
- AsyncStorage for token persistence testing
- Navigation for routing behavior
- Platform-specific modules (safe area, dimensions)

### Redux Store
- Isolated store instances for each test
- Preloaded state for complex scenarios
- Action dispatch verification

## Best Practices

### Test Structure
1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the functionality being tested
3. **Assert**: Verify expected outcomes

### Naming Conventions
- Test files: `*.test.ts/tsx`
- Describe blocks: Feature or component name
- Test cases: "should [expected behavior] when [condition]"

### Error Testing
- Network errors and timeouts
- API errors with various status codes
- Validation errors and form handling
- Authentication failures and token expiry

### Accessibility Testing
- Screen reader navigation
- Keyboard accessibility
- Proper ARIA labels and roles

## Key Features Tested

### Authentication System
✅ User registration and login
✅ Token storage and persistence
✅ Logout and state clearing
✅ Error handling and recovery

### Groups Functionality
✅ Group creation with auto-join
✅ Member management and invitations
✅ Privacy settings and access control
✅ Group deletion and leave operations

### Pet Management
✅ Pet CRUD operations
✅ Owner relationships
✅ Species-based filtering
✅ Data validation

### Points System
✅ Behavior management
✅ Score event creation
✅ Leaderboards and statistics
✅ Group-based scoring

### Navigation
✅ Screen transitions
✅ Parameter passing
✅ Tab navigation
✅ Authentication routing

### State Management
✅ Redux store operations
✅ Async thunk handling
✅ Error state management
✅ Loading states

## Debugging Tests

### Running Individual Tests
```bash
yarn test CreateGroupScreen.test.tsx
```

### Debugging Mode
```bash
yarn test --no-coverage --verbose CreateGroupScreen.test.tsx
```

### Mock Debugging
Enable mock call inspection:
```javascript
console.log(mockedApiService.createGroup.mock.calls);
```

## Future Test Additions

When adding new features, ensure tests cover:
1. **Happy path**: Normal user workflow
2. **Error paths**: All possible failure scenarios
3. **Edge cases**: Boundary conditions and unusual inputs
4. **Performance**: Large datasets and rapid interactions
5. **Accessibility**: Screen reader and keyboard navigation

## Test Data Management

### Mock Data
- Realistic user profiles and pets
- Various group configurations
- Multiple behavior types and categories
- Different error response formats

### Test Isolation
- Each test runs with fresh state
- Mocks are reset between tests
- No shared test data dependencies

This comprehensive test suite ensures the Pet of the Day application maintains high quality and prevents regressions as new features are added.