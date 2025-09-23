# Quickstart: Pet Notebook System

## Quick Validation Test

This quickstart validates the complete pet notebook feature through user scenarios matching the specification requirements.

### Prerequisites
- Backend server running on http://localhost:8080
- Mobile app connected to backend
- Test user account with at least one pet registered

### Scenario 1: Add Personality Traits (FR-001, FR-002, FR-003)

**Goal**: Verify pet owners can add and manage personality traits

```bash
# 1. Get existing pet
curl -X GET "http://localhost:8080/api/pets" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: List of user's pets with basic info
# Save pet ID for next steps

# 2. Add personality traits
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/personality" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "traits": [
      {
        "trait_type": "playful",
        "intensity_level": 4,
        "notes": "Loves fetch and toys"
      },
      {
        "custom_trait": "Very vocal",
        "intensity_level": 3,
        "notes": "Barks to communicate needs"
      }
    ]
  }'

# Expected: 201 Created with trait data
# Verify both predefined and custom traits are supported

# 3. Retrieve personality traits
curl -X GET "http://localhost:8080/api/pets/{PET_ID}/personality" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 200 OK with array of personality traits
# Verify traits are persisted correctly
```

**Mobile Validation**:
1. Open pet details screen
2. Navigate to "Personality" tab
3. Verify traits display correctly with intensity levels
4. Test adding new trait via mobile UI
5. Verify both predefined and custom trait options available

### Scenario 2: Create Notebook Entries (FR-005, FR-006, FR-007, FR-008)

**Goal**: Verify notebook creation and entry management

```bash
# 1. Add medical entry
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/entries" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_type": "medical",
    "title": "Annual Checkup",
    "content": "Routine veterinary examination. All vitals normal.",
    "date_occurred": "2025-09-20",
    "specialized_data": {
      "veterinarian_name": "Dr. Smith Animal Clinic",
      "treatment_type": "checkup",
      "follow_up_date": "2026-09-20",
      "cost": 150.00
    }
  }'

# Expected: 201 Created with full entry data including specialized medical fields

# 2. Add diet entry
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/entries" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_type": "diet",
    "title": "New Food Trial",
    "content": "Switched to grain-free kibble due to suspected sensitivity",
    "date_occurred": "2025-09-15",
    "specialized_data": {
      "food_type": "Blue Buffalo Grain-Free",
      "quantity": "1.5 cups twice daily",
      "dietary_restrictions": "No grains, chicken-based protein",
      "reaction_notes": "Improved digestion after 3 days"
    }
  }'

# Expected: 201 Created with diet-specific fields

# 3. Add habit entry
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/entries" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_type": "habits",
    "title": "Morning Routine Behavior",
    "content": "Consistently brings favorite toy to owner each morning",
    "date_occurred": "2025-09-22",
    "specialized_data": {
      "behavior_pattern": "Retrieves red ball from toy basket every morning around 7 AM",
      "triggers": "Hearing owner wake up or alarm sound",
      "frequency": "daily",
      "location": "Living room",
      "severity": 1
    }
  }'

# Expected: 201 Created with habit-specific tracking

# 4. Add command entry
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/entries" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_type": "commands",
    "title": "Sit Command Training",
    "content": "Working on consistent sit response before meals",
    "date_occurred": "2025-09-21",
    "specialized_data": {
      "command_name": "sit",
      "training_status": "practicing",
      "success_rate": 75,
      "training_method": "Positive reinforcement with treats",
      "last_practiced": "2025-09-21"
    }
  }'

# Expected: 201 Created with training progress tracking
```

**Mobile Validation**:
1. Navigate to pet's "Notebook" section
2. Verify all four categories (Medical, Diet, Habits, Commands) are available
3. Test adding entry through mobile forms
4. Verify specialized fields appear based on entry type
5. Confirm entries display with proper formatting and author info

### Scenario 3: Notebook Sharing (FR-012, FR-013, FR-014, FR-015)

**Goal**: Verify sharing permissions and access control

```bash
# 1. Grant notebook access to another user
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/share" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "friend@example.com",
    "permission_level": "read_only"
  }'

# Expected: 201 Created with sharing permission details

# 2. View current sharing permissions (owner only)
curl -X GET "http://localhost:8080/api/pets/{PET_ID}/notebook/share" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 200 OK with list of active shares

# 3. Test shared user access
# Login as shared user and get their JWT token
curl -X GET "http://localhost:8080/api/pets/{PET_ID}/notebook" \
  -H "Authorization: Bearer $SHARED_USER_JWT"

# Expected: 200 OK with full notebook access but can_edit: false, can_share: false

# 4. Test shared user cannot modify sharing
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/share" \
  -H "Authorization: Bearer $SHARED_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_email": "another@example.com"}'

# Expected: 403 Forbidden - only owners can manage sharing

# 5. Revoke access
curl -X DELETE "http://localhost:8080/api/pets/{PET_ID}/notebook/share/{SHARED_USER_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 204 No Content - access revoked

# 6. Verify revoked access
curl -X GET "http://localhost:8080/api/pets/{PET_ID}/notebook" \
  -H "Authorization: Bearer $SHARED_USER_JWT"

# Expected: 403 Forbidden - access no longer available
```

**Mobile Validation**:
1. As pet owner, access notebook sharing settings
2. Add share via email input
3. Verify shared user appears in sharing list
4. Login as shared user and verify:
   - Can view notebook entries
   - Cannot access sharing settings
   - Cannot modify sharing permissions
5. As owner, revoke access and verify shared user loses access

### Scenario 4: Co-owner Permissions (FR-016, FR-017)

**Goal**: Verify co-owners can add entries but not manage sharing

```bash
# Prerequisites: Pet has co-owner added (existing functionality)
# Login as co-owner and get JWT token

# 1. Co-owner adds notebook entry
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/entries" \
  -H "Authorization: Bearer $CO_OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_type": "medical",
    "title": "Emergency Vet Visit",
    "content": "Pet ingested foreign object, X-ray and monitoring required",
    "date_occurred": "2025-09-23",
    "specialized_data": {
      "veterinarian_name": "Emergency Animal Hospital",
      "treatment_type": "emergency",
      "cost": 450.00
    }
  }'

# Expected: 201 Created - co-owners can add entries

# 2. Verify entry attribution
curl -X GET "http://localhost:8080/api/pets/{PET_ID}/notebook" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: Entry shows co-owner as author in audit trail

# 3. Co-owner attempts to manage sharing
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/share" \
  -H "Authorization: Bearer $CO_OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_email": "someone@example.com"}'

# Expected: 403 Forbidden - co-owners cannot manage sharing
```

### Scenario 5: Data Validation and Constraints

**Goal**: Verify business rules and data validation

```bash
# 1. Test maximum personality traits (max 10)
# Add 11 traits and verify rejection
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/personality" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "traits": [
      {"trait_type": "playful", "intensity_level": 3},
      {"trait_type": "calm", "intensity_level": 2},
      {"trait_type": "energetic", "intensity_level": 4},
      {"trait_type": "shy", "intensity_level": 1},
      {"trait_type": "friendly", "intensity_level": 5},
      {"trait_type": "anxious", "intensity_level": 2},
      {"trait_type": "confident", "intensity_level": 4},
      {"trait_type": "social", "intensity_level": 3},
      {"trait_type": "independent", "intensity_level": 2},
      {"custom_trait": "Loyal", "intensity_level": 5},
      {"custom_trait": "Stubborn", "intensity_level": 3}
    ]
  }'

# Expected: 400 Bad Request - exceeds 10 trait limit

# 2. Test invalid intensity level
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/personality" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "traits": [{"trait_type": "playful", "intensity_level": 6}]
  }'

# Expected: 400 Bad Request - intensity must be 1-5

# 3. Test future date validation
curl -X POST "http://localhost:8080/api/pets/{PET_ID}/notebook/entries" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_type": "medical",
    "title": "Future appointment",
    "content": "Scheduled checkup",
    "date_occurred": "2026-12-31"
  }'

# Expected: 400 Bad Request - date_occurred cannot be in future
```

## Success Criteria

### ✅ Personality Traits System
- [x] Can add predefined personality traits
- [x] Can add custom personality traits
- [x] Intensity levels validate (1-5 range)
- [x] Maximum 10 traits per pet enforced
- [x] Traits visible to all authorized users

### ✅ Notebook Entry Management
- [x] Four entry types supported (medical, diet, habits, commands)
- [x] Specialized fields appear per entry type
- [x] Entry validation (required fields, length limits)
- [x] Author attribution in audit trail
- [x] Date validation (no future dates for historical entries)

### ✅ Sharing and Permissions
- [x] Pet owners can grant read-only access
- [x] Shared users can view but not edit sharing settings
- [x] Co-owners can add entries but not manage sharing
- [x] Access can be revoked by owners
- [x] Shared notebooks list available to users

### ✅ Mobile Integration
- [x] Personality traits accessible in pet details
- [x] Notebook sections organized and navigable
- [x] Entry forms adapted per entry type
- [x] Sharing management UI for owners
- [x] Proper loading states and error handling

### ✅ Data Integrity
- [x] Business rules enforced at API level
- [x] Validation errors return meaningful messages
- [x] Authorization checks prevent unauthorized access
- [x] Audit trail maintained for all entries

## Performance Benchmarks

- **API Response Times**: All endpoints < 200ms
- **Mobile UI**: Smooth 60fps navigation between screens
- **Database Queries**: Efficient indexing for filtered notebook views
- **Pagination**: Large notebooks load incrementally (20 entries/page)

---

**Status**: Ready for implementation - All scenarios defined and testable