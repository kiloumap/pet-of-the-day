# Data Model: Pet Notebook System

## Entity Definitions

### PetPersonality
**Purpose**: Store personality traits for pets to help owners and caretakers understand behavior patterns.

**Attributes**:
- `id`: UUID - Primary key
- `pet_id`: UUID - Foreign key to Pet entity
- `trait_type`: Enum - Predefined categories (playful, calm, energetic, shy, aggressive, friendly, anxious, confident, social, independent)
- `custom_trait`: String(100) - Optional custom trait description
- `intensity_level`: Integer(1-5) - How strong this trait is (1=mild, 5=very strong)
- `notes`: Text - Additional observations about this trait
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Validation Rules**:
- Either `trait_type` OR `custom_trait` must be set, not both
- `intensity_level` must be between 1 and 5
- `custom_trait` max length 100 characters
- Pet can have maximum 10 personality traits
- No duplicate trait_type per pet

**Relationships**:
- Belongs to one Pet (many-to-one)

### PetNotebook
**Purpose**: Container for all notebook information about a specific pet.

**Attributes**:
- `id`: UUID - Primary key
- `pet_id`: UUID - Foreign key to Pet entity (unique)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `entry_count`: Integer - Denormalized count for UI display
- `last_entry_date`: Timestamp - For quick sorting/filtering

**Validation Rules**:
- One notebook per pet (unique constraint on pet_id)
- Auto-created when first entry is added to a pet

**Relationships**:
- Belongs to one Pet (one-to-one)
- Has many NotebookEntry (one-to-many)
- Has many NotebookShare (one-to-many)

### NotebookEntry
**Purpose**: Individual entries within a pet's notebook across all categories.

**Attributes**:
- `id`: UUID - Primary key
- `notebook_id`: UUID - Foreign key to PetNotebook
- `author_id`: UUID - Foreign key to User (who created this entry)
- `entry_type`: Enum - Category (medical, diet, habits, commands)
- `title`: String(200) - Brief title/summary
- `content`: Text - Main content (JSON for structured data)
- `date_occurred`: Date - When this happened (different from created_at)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `tags`: String[] - Optional tags for filtering

**Validation Rules**:
- `title` required, max 200 characters
- `content` required, max 10,000 characters
- `date_occurred` cannot be in the future
- `entry_type` must be valid enum value

**Relationships**:
- Belongs to one PetNotebook (many-to-one)
- Belongs to one User (author) (many-to-one)

### MedicalEntry
**Purpose**: Specialized notebook entry for medical information with structured fields.

**Attributes**:
- `notebook_entry_id`: UUID - Foreign key to NotebookEntry (one-to-one)
- `veterinarian_name`: String(100) - Vet or clinic name
- `treatment_type`: Enum - Checkup, vaccination, surgery, medication, emergency, other
- `medications`: Text - Current or prescribed medications
- `follow_up_date`: Date - Next appointment or check date
- `cost`: Decimal - Optional cost tracking
- `attachments`: String[] - File paths for photos/documents

**Validation Rules**:
- Parent NotebookEntry must have entry_type = 'medical'
- `follow_up_date` must be in the future if provided
- `cost` must be positive if provided
- Maximum 5 attachments per entry

**Relationships**:
- Extends NotebookEntry (one-to-one)

### DietEntry
**Purpose**: Specialized notebook entry for diet and feeding information.

**Attributes**:
- `notebook_entry_id`: UUID - Foreign key to NotebookEntry (one-to-one)
- `food_type`: String(100) - Brand/type of food
- `quantity`: String(50) - Amount fed (e.g., "1 cup", "2 treats")
- `feeding_schedule`: String(200) - When and how often
- `dietary_restrictions`: Text - Allergies, intolerances, special needs
- `reaction_notes`: Text - How pet responded to this diet

**Validation Rules**:
- Parent NotebookEntry must have entry_type = 'diet'
- At least one of the specialized fields must be filled

**Relationships**:
- Extends NotebookEntry (one-to-one)

### HabitEntry
**Purpose**: Specialized notebook entry for behavioral patterns and habits.

**Attributes**:
- `notebook_entry_id`: UUID - Foreign key to NotebookEntry (one-to-one)
- `behavior_pattern`: Text - Description of the habit/behavior
- `triggers`: Text - What causes this behavior
- `frequency`: Enum - Daily, weekly, monthly, occasional, rare
- `location`: String(100) - Where this typically happens
- `severity`: Integer(1-5) - How concerning/notable (1=minor, 5=major)

**Validation Rules**:
- Parent NotebookEntry must have entry_type = 'habits'
- `severity` must be between 1 and 5
- `behavior_pattern` is required

**Relationships**:
- Extends NotebookEntry (one-to-one)

### CommandEntry
**Purpose**: Specialized notebook entry for commands and training information.

**Attributes**:
- `notebook_entry_id`: UUID - Foreign key to NotebookEntry (one-to-one)
- `command_name`: String(50) - Name of the command (sit, stay, come, etc.)
- `training_status`: Enum - Learning, practicing, mastered, needs_work
- `success_rate`: Integer(0-100) - Percentage of successful responses
- `training_method`: Text - How this was taught
- `last_practiced`: Date - When this was last worked on

**Validation Rules**:
- Parent NotebookEntry must have entry_type = 'commands'
- `command_name` is required
- `success_rate` must be between 0 and 100
- `last_practiced` cannot be in the future

**Relationships**:
- Extends NotebookEntry (one-to-one)

### NotebookShare
**Purpose**: Manages sharing permissions for pet notebooks with other users.

**Attributes**:
- `id`: UUID - Primary key
- `notebook_id`: UUID - Foreign key to PetNotebook
- `shared_with_user_id`: UUID - Foreign key to User (who gets access)
- `shared_by_user_id`: UUID - Foreign key to User (who granted access)
- `permission_level`: Enum - read_only (currently only option)
- `granted_at`: Timestamp
- `revoked_at`: Timestamp - NULL if still active
- `status`: Enum - active, revoked

**Validation Rules**:
- Cannot share with yourself (`shared_with_user_id` ≠ `shared_by_user_id`)
- Only pet owner can grant sharing permissions
- Cannot have duplicate active shares for same notebook+user combination
- `revoked_at` must be after `granted_at` if present

**Relationships**:
- Belongs to one PetNotebook (many-to-one)
- Belongs to one User (shared_with) (many-to-one)
- Belongs to one User (shared_by) (many-to-one)

## Database Schema Extensions

### New Ent Schema Files

**backend/ent/schema/pet_personality.go**:
```go
type PetPersonality struct {
    ent.Schema
}

func (PetPersonality) Fields() []ent.Field {
    return []ent.Field{
        field.UUID("id", uuid.UUID{}).Default(uuid.New).Immutable(),
        field.Enum("trait_type").Values("playful", "calm", "energetic", "shy", "aggressive", "friendly", "anxious", "confident", "social", "independent").Optional(),
        field.String("custom_trait").MaxLen(100).Optional(),
        field.Int("intensity_level").Range(1, 5),
        field.Text("notes").Optional(),
        field.Time("created_at").Default(time.Now).Immutable(),
        field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
    }
}

func (PetPersonality) Edges() []ent.Edge {
    return []ent.Edge{
        edge.From("pet", Pet.Type).Ref("personality_traits").Unique().Required(),
    }
}
```

**backend/ent/schema/pet_notebook.go**:
```go
type PetNotebook struct {
    ent.Schema
}

func (PetNotebook) Fields() []ent.Field {
    return []ent.Field{
        field.UUID("id", uuid.UUID{}).Default(uuid.New).Immutable(),
        field.Time("created_at").Default(time.Now).Immutable(),
        field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
        field.Int("entry_count").Default(0),
        field.Time("last_entry_date").Optional(),
    }
}

func (PetNotebook) Edges() []ent.Edge {
    return []ent.Edge{
        edge.From("pet", Pet.Type).Ref("notebook").Unique().Required(),
        edge.To("entries", NotebookEntry.Type),
        edge.To("shares", NotebookShare.Type),
    }
}
```

### Updated Pet Schema
**backend/ent/schema/pet.go** (additions):
```go
// Add to existing Pet edges
edge.To("personality_traits", PetPersonality.Type),
edge.To("notebook", PetNotebook.Type).Unique(),
```

## State Transitions

### Notebook Lifecycle
1. **Created**: When first entry is added to a pet
2. **Active**: Contains entries, can be shared
3. **Shared**: Has active sharing permissions
4. **Archived**: Pet is archived/deleted (soft delete)

### Sharing Permissions
1. **Pending**: Invitation sent (future feature)
2. **Active**: User has access to notebook
3. **Revoked**: Access removed by owner

### Training Commands
1. **Learning**: Just started training this command
2. **Practicing**: Pet knows command but inconsistent
3. **Mastered**: Pet reliably responds to command
4. **Needs Work**: Was mastered but regression occurred

## Indexes and Performance

### Required Database Indexes
```sql
-- Query notebooks by pet efficiently
CREATE INDEX idx_pet_notebook_pet_id ON pet_notebooks(pet_id);

-- Query entries by notebook and type for filtered views
CREATE INDEX idx_notebook_entry_notebook_type_date ON notebook_entries(notebook_id, entry_type, date_occurred DESC);

-- Query shared notebooks by user
CREATE INDEX idx_notebook_share_user_status ON notebook_shares(shared_with_user_id, status);

-- Query personality traits by pet
CREATE INDEX idx_pet_personality_pet_id ON pet_personalities(pet_id);

-- Full-text search on entry content (future feature)
CREATE INDEX idx_notebook_entry_content_fts ON notebook_entries USING gin(to_tsvector('english', title || ' ' || content));
```

### Pagination Strategy
- Notebook entries: 20 per page, ordered by `date_occurred DESC`
- Personality traits: All loaded (max 10 per pet)
- Shared notebooks: 10 per page for user's shared access list

## Validation Summary

### Business Rules Enforced at Domain Level
- Pet owners can only modify their own pets' notebooks
- Co-owners can add entries but cannot manage sharing
- Shared users have read-only access
- Maximum 10 personality traits per pet
- Specialized entry types must match parent entry type
- Future dates not allowed for historical entries

### Data Integrity Constraints
- Foreign key relationships enforced at database level
- Unique constraints prevent duplicate data
- Check constraints validate enum values and ranges
- NOT NULL constraints ensure required data is present

---

**Status**: ✅ Complete - All entities defined with validation rules and relationships