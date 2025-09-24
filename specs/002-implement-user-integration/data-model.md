# Data Model: User Integration System

## Entity Overview

The user integration system extends the existing User and Pet entities with new bounded contexts for personality traits, notebook management, and sharing systems.

## Core Entities

### User (Existing - Enhanced)
**Purpose**: Represents a system user with authentication and profile information

**Fields**:
- `id`: UUID (Primary Key)
- `email`: String (Unique, Required)
- `password_hash`: String (Required)
- `first_name`: String (Required)
- `last_name`: String (Required)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `owned_pets`: One-to-Many with Pet (as primary owner)
- `co_owned_pets`: Many-to-Many with Pet through CoOwnerRelationship
- `shared_notebooks`: Many-to-Many with PetNotebook through NotebookShare

**Validation Rules**:
- Email must be valid format and unique
- Password must meet security requirements
- Names must be non-empty strings

### Pet (Existing - Enhanced)
**Purpose**: Represents a pet with ownership and profile information

**Fields**:
- `id`: UUID (Primary Key)
- `name`: String (Required)
- `breed`: String (Required)
- `birth_date`: Date (Required, not future)
- `photo_url`: String (Optional)
- `primary_owner_id`: UUID (Foreign Key to User, Required)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `primary_owner`: Many-to-One with User
- `co_owners`: Many-to-Many with User through CoOwnerRelationship
- `personality_traits`: One-to-Many with PetPersonality
- `notebook`: One-to-One with PetNotebook

**Validation Rules**:
- Name must be unique per primary owner
- Birth date cannot be in the future
- Photo URL must be valid URL format (if provided)
- Primary owner cannot be changed (permanent relationship)

## New Bounded Context: PetProfiles

### PetPersonality
**Purpose**: Represents personality traits assigned to pets

**Fields**:
- `id`: UUID (Primary Key)
- `pet_id`: UUID (Foreign Key to Pet, Required)
- `trait_type`: Enum (Optional) - predefined trait types
- `custom_trait`: String (Optional, max 100 chars)
- `intensity_level`: Integer (Required, 1-5 range)
- `notes`: Text (Optional)
- `added_by`: UUID (Foreign Key to User, Required)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `pet`: Many-to-One with Pet
- `added_by_user`: Many-to-One with User

**Validation Rules**:
- Either `trait_type` OR `custom_trait` must be set, not both
- Maximum 5 personality traits per pet
- Intensity level must be 1-5
- Custom trait max length 100 characters
- No duplicate trait types per pet

**Trait Type Enum Values**:
- playful, calm, energetic, shy, aggressive, friendly, anxious, confident, social, independent

## New Bounded Context: Notebook

### PetNotebook
**Purpose**: Container for all notebook entries for a pet

**Fields**:
- `id`: UUID (Primary Key)
- `pet_id`: UUID (Foreign Key to Pet, Required)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `pet`: One-to-One with Pet
- `entries`: One-to-Many with NotebookEntry
- `shares`: One-to-Many with NotebookShare

### NotebookEntry
**Purpose**: Base entry for all notebook information

**Fields**:
- `id`: UUID (Primary Key)
- `notebook_id`: UUID (Foreign Key to PetNotebook, Required)
- `entry_type`: Enum (Required) - medical, diet, habits, commands
- `title`: String (Required, max 200 chars)
- `content`: Text (Required, max 10,000 chars)
- `date_occurred`: DateTime (Required, not future)
- `tags`: JSON Array of Strings (Optional, max 10 tags)
- `author_id`: UUID (Foreign Key to User, Required)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `notebook`: Many-to-One with PetNotebook
- `author`: Many-to-One with User
- `medical_entry`: One-to-One with MedicalEntry (conditional)
- `diet_entry`: One-to-One with DietEntry (conditional)
- `habit_entry`: One-to-One with HabitEntry (conditional)
- `command_entry`: One-to-One with CommandEntry (conditional)

**Validation Rules**:
- Title required, max 200 characters
- Content required, max 10,000 characters
- Date occurred cannot be in future
- Maximum 10 tags per entry
- Entry type must be valid enum value

### MedicalEntry
**Purpose**: Specialized data for medical notebook entries

**Fields**:
- `id`: UUID (Primary Key)
- `entry_id`: UUID (Foreign Key to NotebookEntry, Required)
- `veterinarian_name`: String (Optional)
- `treatment_type`: String (Optional)
- `medications`: Text (Optional)
- `follow_up_date`: DateTime (Optional, must be future if set)
- `cost`: Decimal (Optional, must be positive)
- `attachments`: JSON Array of Strings (Optional, max 5 URLs)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `entry`: One-to-One with NotebookEntry

**Validation Rules**:
- Follow-up date must be in future if provided
- Cost must be positive if provided
- Maximum 5 attachments per entry

### DietEntry
**Purpose**: Specialized data for diet notebook entries

**Fields**:
- `id`: UUID (Primary Key)
- `entry_id`: UUID (Foreign Key to NotebookEntry, Required)
- `food_type`: String (Optional)
- `quantity`: String (Optional)
- `feeding_schedule`: String (Optional)
- `dietary_restrictions`: Text (Optional)
- `reaction_notes`: Text (Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `entry`: One-to-One with NotebookEntry

**Validation Rules**:
- At least one specialized field must be provided

### HabitEntry
**Purpose**: Specialized data for habit notebook entries

**Fields**:
- `id`: UUID (Primary Key)
- `entry_id`: UUID (Foreign Key to NotebookEntry, Required)
- `behavior_pattern`: String (Required)
- `triggers`: Text (Optional)
- `frequency`: String (Optional)
- `location`: String (Optional)
- `severity`: Integer (Required, 1-5 range)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `entry`: One-to-One with NotebookEntry

**Validation Rules**:
- Behavior pattern required
- Severity must be 1-5

### CommandEntry
**Purpose**: Specialized data for command notebook entries

**Fields**:
- `id`: UUID (Primary Key)
- `entry_id`: UUID (Foreign Key to NotebookEntry, Required)
- `command_name`: String (Required)
- `training_status`: String (Optional)
- `success_rate`: Integer (Optional, 0-100 range)
- `training_method`: Text (Optional)
- `last_practiced`: DateTime (Optional, not future)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `entry`: One-to-One with NotebookEntry

**Validation Rules**:
- Command name required
- Success rate must be 0-100 if provided
- Last practiced cannot be in future

## Sharing System

### NotebookShare
**Purpose**: Manages sharing permissions for notebooks

**Fields**:
- `id`: UUID (Primary Key)
- `notebook_id`: UUID (Foreign Key to PetNotebook, Required)
- `shared_with_email`: String (Required, valid email)
- `shared_by`: UUID (Foreign Key to User, Required)
- `read_only`: Boolean (Default: true)
- `granted_at`: DateTime (Required)
- `revoked_at`: DateTime (Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `notebook`: Many-to-One with PetNotebook
- `shared_by_user`: Many-to-One with User

**Validation Rules**:
- Cannot share with self (shared_with_email != owner's email)
- No duplicate active shares for same notebook+email
- Revoked date must be after granted date
- Valid email format required

### CoOwnerRelationship
**Purpose**: Manages co-ownership relationships between users and pets

**Fields**:
- `id`: UUID (Primary Key)
- `pet_id`: UUID (Foreign Key to Pet, Required)
- `co_owner_id`: UUID (Foreign Key to User, Required)
- `granted_by`: UUID (Foreign Key to User, Required)
- `granted_at`: DateTime (Required)
- `revoked_at`: DateTime (Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- `pet`: Many-to-One with Pet
- `co_owner`: Many-to-One with User
- `granted_by_user`: Many-to-One with User

**Validation Rules**:
- Co-owner cannot be the primary owner
- Only primary owner can grant/revoke co-ownership
- No duplicate active co-ownership for same pet+user

## State Transitions

### Pet Lifecycle
1. **Created**: Pet registered by primary owner
2. **Active**: Normal operation with potential co-owners
3. **Archived**: Pet marked as inactive (future enhancement)

### Notebook Entry Lifecycle
1. **Draft**: Entry being created (future enhancement)
2. **Published**: Entry saved and visible to authorized users
3. **Updated**: Entry modified with audit trail
4. **Deleted**: Entry removed (soft delete with audit trail)

### Sharing Lifecycle
1. **Granted**: Share created and active
2. **Revoked**: Share access removed
3. **Expired**: Share automatically expired (future enhancement)

## Access Control Matrix

| User Type | Pet Data | Personality Traits | Notebook Entries | Sharing Management |
|-----------|----------|-------------------|------------------|-------------------|
| Primary Owner | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| Co-Owner | Read/Update basic info | Full CRUD | Full CRUD | Read only |
| Shared User | Read only | Read only | Read only | None |
| Unauthorized | None | None | None | None |

## Database Indexes

### Performance Optimization
- `pets.primary_owner_id` - Fast owner lookup
- `pets.name, primary_owner_id` - Unique constraint enforcement
- `pet_personalities.pet_id` - Fast trait lookup
- `notebook_entries.notebook_id, date_occurred` - Chronological entry retrieval
- `notebook_entries.entry_type` - Type-based filtering
- `notebook_shares.shared_with_email` - User's shared notebooks lookup
- `co_owner_relationships.co_owner_id` - User's co-owned pets lookup

### Data Integrity
- Foreign key constraints on all relationships
- Unique constraints for preventing duplicates
- Check constraints for enum values and ranges