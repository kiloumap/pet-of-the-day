# Data Model: Pet Behavior Logging with Point System

**Date**: 2025-09-25
**Feature**: Pet behavior logging with real-time scoring and "Pet of the Day" selection

## Core Entities

### Behavior
Represents a predefined action that pets can perform, with associated point values.

**Fields**:
- `id`: UUID (primary key)
- `name`: String (required, unique) - e.g., "Went potty outside"
- `description`: String (optional) - Detailed explanation
- `category`: String (required) - e.g., "potty_training", "feeding", "social"
- `point_value`: Integer (required) - Can be positive or negative
- `min_interval_minutes`: Integer (required) - Minimum time between same behavior logs
- `created_at`: Timestamp (auto-generated)
- `updated_at`: Timestamp (auto-updated)

**Validation Rules**:
- Name must be 1-100 characters
- Point value must be between -10 and +10
- Min interval must be between 5 and 1440 minutes (1 day)
- Category must be from predefined enum

**State Transitions**: Static reference data (no state changes)

### BehaviorLog
Records when a specific behavior was logged for a pet.

**Fields**:
- `id`: UUID (primary key)
- `pet_id`: UUID (foreign key to pets.id, required)
- `behavior_id`: UUID (foreign key to behaviors.id, required)
- `user_id`: UUID (foreign key to users.id, required) - Who logged it
- `points_awarded`: Integer (required) - Snapshot of behavior point value
- `logged_at`: Timestamp (required) - When behavior occurred
- `created_at`: Timestamp (auto-generated) - When log entry was created
- `notes`: String (optional, max 500 chars) - User notes

**Relationships**:
- `pet`: Many-to-One with Pet entity
- `behavior`: Many-to-One with Behavior entity
- `user`: Many-to-One with User entity
- `group_shares`: One-to-Many with BehaviorLogGroupShare entity

**Validation Rules**:
- Pet must exist and user must be owner/co-owner
- Behavior must exist and be active
- Logged_at cannot be more than 24 hours in the past
- Points_awarded must match behavior.point_value at creation time
- Notes limited to 500 characters

**State Transitions**: Immutable once created (audit trail integrity)

### BehaviorLogGroupShare
Maps which groups should see a specific behavior log entry.

**Fields**:
- `id`: UUID (primary key)
- `behavior_log_id`: UUID (foreign key to behavior_logs.id, required)
- `group_id`: UUID (foreign key to groups.id, required)
- `created_at`: Timestamp (auto-generated)

**Relationships**:
- `behavior_log`: Many-to-One with BehaviorLog entity
- `group`: Many-to-One with Group entity

**Validation Rules**:
- Pet must be member of the group
- User must have permission to share in group
- Unique constraint on (behavior_log_id, group_id)

### DaillyScore (typo preserved - existing table)
Tracks accumulated points for each pet per day within each group.

**Extended Fields** (building on existing):
- `behavior_point_total`: Integer (default 0) - Points from behavior logs
- `negative_behavior_count`: Integer (default 0) - Count of negative behaviors for tie-breaking
- `last_behavior_logged_at`: Timestamp (nullable) - For duplicate prevention

**Validation Rules**:
- Behavior_point_total can be negative
- Negative_behavior_count must be >= 0
- Daily boundaries calculated using user's timezone preferences

### PetOfTheDay
Records daily winners for each group.

**Fields**:
- `id`: UUID (primary key)
- `group_id`: UUID (foreign key to groups.id, required)
- `pet_id`: UUID (foreign key to pets.id, required)
- `date`: Date (required) - Date of victory
- `final_score`: Integer (required) - Total points for that day
- `negative_behaviors`: Integer (required) - Count for tie-breaking record
- `created_at`: Timestamp (auto-generated)

**Relationships**:
- `group`: Many-to-One with Group entity
- `pet`: Many-to-One with Pet entity

**Validation Rules**:
- Unique constraint on (group_id, date, pet_id) - Multiple winners allowed
- Final_score must match calculated daily total
- Date cannot be in the future

### UserSettings (Extended)
Extends existing user settings with behavior-related preferences.

**Additional Fields**:
- `daily_reset_time`: Time (default "21:00") - When daily scoring resets
- `timezone`: String (required, default from signup location) - IANA timezone identifier

**Validation Rules**:
- Timezone must be valid IANA timezone
- Daily_reset_time must be valid 24-hour time format

## Materialized Views

### GroupDailyRankings
Materialized view for efficient real-time leaderboard queries.

**Fields**:
- `group_id`: UUID
- `pet_id`: UUID
- `pet_name`: String
- `owner_name`: String
- `current_date`: Date (in group's primary timezone)
- `total_points`: Integer
- `negative_behavior_count`: Integer
- `ranking_position`: Integer
- `last_updated`: Timestamp

**Refresh Strategy**: Triggered on behavior log creation/update

### BehaviorLogsByMonth
Partitioned view for efficient historical queries within retention period.

**Fields**:
- `month_year`: String (YYYY-MM format)
- `pet_id`: UUID
- `behavior_count`: Integer
- `total_points`: Integer
- `average_daily_points`: Decimal

**Cleanup Strategy**: Automatically purged after 6 months

## Indexes

### Performance Indexes
```sql
-- For real-time ranking queries
CREATE INDEX idx_daily_scores_group_date_points ON daily_scores(group_id, date, total_points DESC);

-- For behavior log duplicate prevention
CREATE INDEX idx_behavior_logs_pet_behavior_logged_at ON behavior_logs(pet_id, behavior_id, logged_at DESC);

-- For group sharing lookups
CREATE INDEX idx_behavior_log_group_shares_group_log ON behavior_log_group_shares(group_id, behavior_log_id);

-- For data retention cleanup
CREATE INDEX idx_behavior_logs_created_at ON behavior_logs(created_at);
```

### Unique Constraints
```sql
-- Prevent duplicate group shares
ALTER TABLE behavior_log_group_shares ADD CONSTRAINT uq_log_group UNIQUE(behavior_log_id, group_id);

-- Ensure behavior name uniqueness
ALTER TABLE behaviors ADD CONSTRAINT uq_behavior_name UNIQUE(name);
```

## Data Relationships

### Entity Relationship Overview
```
User
 ├── BehaviorLog (1:N) - Who logged the behavior
 └── UserSettings (1:1) - Timezone and reset preferences

Pet
 ├── BehaviorLog (1:N) - Behaviors logged for this pet
 ├── DailyScore (1:N) - Daily point totals per group
 └── PetOfTheDay (1:N) - Daily victories

Behavior
 └── BehaviorLog (1:N) - Usage instances

Group
 ├── BehaviorLogGroupShare (1:N) - Which logs are shared
 ├── DailyScore (1:N) - Per-group daily scores
 └── PetOfTheDay (1:N) - Daily winners

BehaviorLog
 ├── BehaviorLogGroupShare (1:N) - Group visibility
 └── Pet, Behavior, User (N:1 each)
```

### Cross-Bounded Context Integration
- **User Context**: UserSettings extension, ownership validation
- **Pet Context**: Pet entity reference, ownership checks
- **Community Context**: Group entity reference, membership validation
- **Points Context**: DailyScore integration, leaderboard calculations

## Migration Strategy

### Phase 1: Core Tables
1. Create `behaviors` table with seeded data
2. Create `behavior_logs` table
3. Create `behavior_log_group_shares` table
4. Extend `user_settings` with timezone fields
5. Create `pet_of_the_day` table

### Phase 2: Performance Optimization
1. Add indexes for query performance
2. Create materialized views for rankings
3. Set up automated refresh triggers
4. Implement data retention policies

### Phase 3: Data Seeding
1. Insert predefined behavior catalog (50+ behaviors across categories)
2. Set default user timezone preferences based on existing data
3. Initialize daily score tracking for existing pets

## Compliance Notes

### Clean Architecture
- Domain entities defined with business rules
- Repository interfaces abstract data access
- Value objects for timezone and time calculations
- Domain services for ranking and scoring logic

### Data Retention
- Automated cleanup of behavior_logs > 6 months
- Preserve daily_scores and pet_of_the_day indefinitely
- Archive strategy for compliance with data retention policies

### Performance
- Materialized views ensure <200ms query response times
- Proper indexing for real-time ranking updates
- Database partitioning for historical data management