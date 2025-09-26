# Research: Pet Behavior Logging with Point System

**Date**: 2025-09-25
**Feature**: Pet behavior logging with real-time scoring and "Pet of the Day" selection

## Research Findings

### 1. Time Zone Handling for Daily Reset

**Decision**: Use user-configurable reset time (default 9PM) in user's local timezone
**Rationale**:
- Each user can set their preferred "end of day" time (default 9PM)
- Store user timezone preferences in user profile
- Calculate daily windows using user's local time for consistent UX
- Backend stores UTC timestamps but computes daily boundaries per user timezone

**Alternatives Considered**:
- Global UTC reset: Rejected - creates poor UX across timezones
- Group-based timezone: Rejected - users in same group may be in different timezones
- Fixed midnight reset: Rejected - doesn't align with pet owner schedules

**Implementation Approach**:
- Store `daily_reset_time` (default "21:00") and `timezone` in user profiles
- Create timezone-aware daily boundary calculation utilities
- Use Go time package for timezone conversions

### 2. Real-time Ranking Updates

**Decision**: Event-driven updates with WebSocket notifications
**Rationale**:
- Points system needs immediate feedback for user engagement
- Real-time leaderboards encourage continued interaction
- WebSocket connections for live updates, with fallback polling

**Alternatives Considered**:
- Polling-only: Rejected - creates unnecessary load and delays
- Server-sent events: Rejected - less interactive than WebSockets
- No real-time: Rejected - reduces gamification value

**Implementation Approach**:
- Event bus system for point changes
- WebSocket handlers for group ranking notifications
- Mobile app subscribes to group-specific ranking events

### 3. Time-Based Duplicate Prevention

**Decision**: Configurable minimum intervals per behavior type
**Rationale**:
- Different behaviors have different natural frequencies
- Prevents gaming while allowing legitimate multiple occurrences
- Example intervals: Potty outside (30 min), Eating (2 hours), Playing (15 min)

**Alternatives Considered**:
- Fixed global interval: Rejected - doesn't fit all behavior types
- No restrictions: Rejected - enables gaming/spam
- Once per behavior per day: Rejected - too restrictive for natural behaviors

**Implementation Approach**:
- Store `min_interval_minutes` in behavior definitions
- Check last occurrence timestamp before allowing new log entry
- Return clear error messages with time until next allowed entry

### 4. Data Retention Strategy

**Decision**: Tiered retention with archive strategy
**Rationale**:
- Individual behavior logs (6 months): Sufficient for behavior pattern analysis
- Daily scoring summaries (lifetime): Enables long-term progress tracking
- Performance optimization through data archiving

**Implementation Approach**:
- Automated cleanup jobs for behavior logs older than 6 months
- Preserve daily score summaries and "Pet of the Day" records indefinitely
- Database partitioning for efficient queries on active data

### 5. Predefined Behavior Catalog Design

**Decision**: Hierarchical behavior categories with fixed point values
**Rationale**:
- Ensures consistent scoring across all groups
- Reduces cognitive load for users (no custom point assignment)
- Enables system-wide behavior analytics

**Behavior Categories**:
- **Potty Training**: Outside (+5), Inside accident (-3), Proper spot (+3)
- **Feeding**: Ate all food (+2), Left food (-1), Stole food (-2)
- **Social**: Good with people (+3), Good with pets (+2), Aggressive (-5)
- **Training**: Followed command (+4), Ignored command (-2), Learned trick (+6)
- **Play**: Active play (+2), Destructive behavior (-4), Calm time (+1)

**Implementation Approach**:
- Database seeding with predefined behaviors
- Behavior versioning for future updates
- Category-based organization in mobile UI

### 6. Multi-Group Behavior Sharing

**Decision**: Selective group sharing with privacy controls
**Rationale**:
- Users want control over which communities see specific behaviors
- Some behaviors may be relevant to training groups but not family groups
- Maintains user agency over data sharing

**Implementation Approach**:
- Behavior logging UI with group selection checkboxes
- Store group associations per behavior log entry
- Query optimizations for group-specific leaderboards

### 7. Performance Optimization for Rankings

**Decision**: Materialized views with incremental updates
**Rationale**:
- Real-time leaderboard queries need <200ms response time
- Point calculations involve complex daily boundary logic
- Materialized views provide consistent performance at scale

**Implementation Approach**:
- Create materialized views for current daily rankings per group
- Trigger updates on behavior log creation/modification
- Redis caching for frequently accessed leaderboards
- Database indexes on (group_id, date, pet_id) for efficient queries

## Technical Dependencies Validation

### Backend (Go)
- **Ent ORM**: Confirmed suitable for complex time-based queries and materialized views
- **Gorilla Mux**: Confirmed adequate for REST API and WebSocket upgrades
- **PostgreSQL**: Confirmed excellent for time-series data and timezone handling
- **Testify**: Confirmed for comprehensive test coverage requirements

### Mobile (React Native)
- **Redux Toolkit**: Confirmed suitable for real-time state updates
- **Expo**: Confirmed compatible with WebSocket connections and background tasks
- **React Navigation**: Confirmed for behavior logging flow navigation
- **TypeScript**: Confirmed for type-safe API integration

## Integration Points

### With Existing Systems
- **User Management**: Extend user profiles with timezone and reset time preferences
- **Pet Management**: Leverage existing pet ownership validation
- **Community System**: Integrate with existing group membership validation
- **Points System**: Extend existing points infrastructure (already implemented)

### New Components Required
- Behavior catalog seeding and management
- Time zone-aware daily boundary calculations
- Real-time WebSocket notification system
- Automated data retention cleanup jobs

## Conclusion

All technical unknowns have been resolved. The approach leverages existing Clean Architecture patterns while adding behavior-specific bounded context components. Performance targets are achievable with proposed caching and materialized view strategy. User experience requirements are addressed through real-time updates and intuitive mobile interface design.