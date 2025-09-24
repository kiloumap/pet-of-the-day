# Data Model: UI/UX Fixes and Mobile App Improvements

**Date**: 2025-09-24
**Context**: UI/UX improvements focus on interface state and user interaction patterns

## Core Entities

### 1. NavigationState
**Purpose**: Manages application navigation state and routing consistency

**Properties**:
- `currentTab`: string - Active bottom tab (home, pets, groups, shared, settings)
- `navigationHistory`: NavigationEntry[] - Stack of previous navigation states
- `modalStack`: ModalState[] - Open modals and their configurations
- `pendingNavigation`: PendingNav | null - Deferred navigation for async operations

**State Transitions**:
- `NAVIGATE` → Updates current tab and adds to history
- `OPEN_MODAL` → Adds modal to stack
- `CLOSE_MODAL` → Removes modal from stack
- `BACK` → Returns to previous navigation state

**Validation Rules**:
- `currentTab` must be one of defined tab names
- `navigationHistory` maximum depth of 10
- `modalStack` maximum of 3 concurrent modals

### 2. InvitationInterface
**Purpose**: UI state for invitation management functionality

**Properties**:
- `invitations`: GroupInvitation[] - List of pending invitations
- `selectedInvitation`: string | null - Currently selected invitation ID
- `actionInProgress`: InvitationAction | null - Current pending action
- `lastUpdated`: timestamp - Last invitation data refresh

**State Transitions**:
- `ACCEPT_INVITATION` → Updates invitation status, triggers group join
- `DECLINE_INVITATION` → Removes invitation from list
- `DISMISS_INVITATION` → Hides invitation without action
- `REFRESH_INVITATIONS` → Reloads invitation data from API

**Validation Rules**:
- `selectedInvitation` must exist in invitations list
- Only one `actionInProgress` at a time
- Invitations auto-expire after 30 days

### 3. PetDetailUIState
**Purpose**: Manages pet detail screen interface state and section visibility

**Properties**:
- `activeSection`: PetSection - Currently displayed section (overview, notes, coowners, personality)
- `editMode`: boolean - Whether editing is enabled
- `unsavedChanges`: PetChanges - Pending modifications
- `sectionData`: SectionData - Data for each expandable section
- `actionSheetVisible`: boolean - Bottom action sheet visibility

**State Transitions**:
- `SWITCH_SECTION` → Changes active section and loads relevant data
- `ENABLE_EDIT` → Enters edit mode for current section
- `SAVE_CHANGES` → Persists changes and exits edit mode
- `DISCARD_CHANGES` → Reverts unsaved changes
- `DELETE_ITEM` → Removes item with confirmation

**Validation Rules**:
- Cannot switch sections with unsaved changes
- `editMode` only available for user-owned or co-owned pets
- Delete actions require confirmation dialog

### 4. TranslationUIState
**Purpose**: Manages language switching and translation coverage UI

**Properties**:
- `currentLanguage`: Language - Active language (en, fr)
- `missingTranslations`: TranslationKey[] - Untranslated keys in current language
- `translationCache`: TranslationCache - Cached translation data
- `fallbacksUsed`: FallbackUsage[] - Track when fallback translations are used

**State Transitions**:
- `CHANGE_LANGUAGE` → Switches language and reloads translations
- `LOAD_TRANSLATIONS` → Populates translation cache
- `REPORT_MISSING` → Logs missing translation for improvement
- `CLEAR_CACHE` → Forces translation reload

**Validation Rules**:
- Language must be supported (en, fr)
- Fallback to English for missing French translations
- Translation keys follow hierarchical dot notation

### 5. ProfileEditState
**Purpose**: User profile editing interface state management

**Properties**:
- `editableFields`: UserField[] - Fields available for editing
- `fieldValues`: FieldValueMap - Current field values and validation state
- `hasChanges`: boolean - Whether unsaved changes exist
- `validationErrors`: ValidationErrorMap - Field-specific error states
- `saveInProgress`: boolean - Whether save operation is active

**State Transitions**:
- `START_EDIT` → Enables editing for specific field
- `UPDATE_FIELD` → Modifies field value with validation
- `SAVE_PROFILE` → Persists changes to backend
- `CANCEL_EDIT` → Discards changes and reverts values

**Validation Rules**:
- Email format validation
- Password strength requirements
- Name length limits (2-50 characters)
- Unique email constraint

### 6. EmptyStateManager
**Purpose**: Handles empty states across different screens and components

**Properties**:
- `emptyStates`: EmptyStateMap - Configuration for different empty scenarios
- `currentEmpty`: EmptyStateKey | null - Active empty state being displayed
- `actionAvailable`: boolean - Whether primary action is available
- `customMessage`: string | null - Context-specific empty state message

**State Transitions**:
- `SHOW_EMPTY` → Displays appropriate empty state for context
- `HIDE_EMPTY` → Removes empty state when content loads
- `TRIGGER_ACTION` → Executes primary action from empty state
- `UPDATE_MESSAGE` → Customizes empty state message

**Validation Rules**:
- Empty state must match current screen context
- Primary action must be contextually appropriate
- Custom messages limited to 100 characters

## Entity Relationships

### NavigationState ↔ Other Entities
- **InvitationInterface**: Navigation affects invitation display
- **PetDetailUIState**: Navigation determines pet detail context
- **ProfileEditState**: Navigation manages profile editing flow

### InvitationInterface → Group System
- **GroupInvitation**: References backend group invitation entity
- **GroupMembership**: Created when invitation is accepted

### PetDetailUIState → Pet System
- **Pet**: Core pet entity being displayed/edited
- **PetNote**: Notes section data
- **CoOwnerRelationship**: Co-owner management data
- **PersonalityTrait**: Pet personality information

### TranslationUIState → Localization
- **TranslationKey**: Individual translation entries
- **Language**: Supported language configurations
- **LocaleData**: Region-specific formatting

### ProfileEditState → User System
- **User**: Core user entity being edited
- **UserPreferences**: User settings and preferences

## Interface Contracts

### State Management Interface
```typescript
interface UIStateManager {
  // Navigation management
  navigateTo(destination: NavigationDestination): Promise<void>
  goBack(): void
  openModal(modal: ModalConfig): void
  closeModal(modalId: string): void

  // Invitation management
  loadInvitations(): Promise<InvitationInterface>
  handleInvitationAction(action: InvitationAction): Promise<void>
  refreshInvitations(): Promise<void>

  // Pet detail management
  switchPetSection(section: PetSection): void
  savePetChanges(changes: PetChanges): Promise<void>
  deletePetItem(itemType: string, itemId: string): Promise<void>

  // Profile editing
  startFieldEdit(field: UserField): void
  saveProfileChanges(): Promise<void>
  validateField(field: string, value: any): ValidationResult

  // Translation management
  changeLanguage(language: Language): Promise<void>
  getTranslation(key: string): string
  reportMissingTranslation(key: string): void

  // Empty state management
  showEmptyState(context: EmptyStateContext): void
  hideEmptyState(): void
  executeEmptyAction(action: EmptyAction): Promise<void>
}
```

### Component Interface
```typescript
interface ComponentUIProps {
  // Theme integration
  theme: Theme
  isDark: boolean

  // Translation integration
  t: TranslationFunction
  currentLanguage: Language

  // State management
  dispatch: DispatchFunction
  selector: StateSelectorFunction

  // Navigation integration
  navigation: NavigationProp
  route: RouteProp

  // Loading and error states
  loading?: boolean
  error?: ErrorState
  onRetry?: () => void
}
```

## Validation & Business Rules

### Navigation Rules
- Maximum 3 concurrent modals
- Navigation history limited to 10 entries
- Modal close requires confirmation if unsaved changes exist

### Invitation Rules
- Invitations expire after 30 days
- User can only have one pending invitation per group
- Accept/decline actions are irreversible

### Pet Detail Rules
- Edit mode only for owners and co-owners
- Notes are private to pet owners
- Personality changes require co-owner consensus for shared pets

### Profile Rules
- Email must be unique across all users
- Password changes require current password verification
- Profile picture uploads limited to 5MB

### Translation Rules
- All user-facing text must have translation key
- Fallback to English for missing French translations
- Translation keys use dot notation hierarchy
- Dynamic content requires parameterized translations

## Performance Considerations

### State Optimization
- Lazy loading for pet detail sections
- Translation cache with TTL expiration
- Navigation history pruning
- Invitation polling with exponential backoff

### Memory Management
- Modal stack cleanup on unmount
- Translation cache size limits
- Image caching for profile pictures
- State persistence for critical data only

This data model focuses on UI state management and user interaction patterns while maintaining compatibility with the existing backend API and Redux store structure.