# Quickstart: Pet Behavior Logging with Point System

**Feature**: Pet behavior logging with real-time scoring and "Pet of the Day" selection
**Target**: 15-minute end-to-end validation scenario

## Prerequisites
- API server running with behavior system implemented
- Mobile app with behavior logging screens
- Test user account with pets in test groups
- Behavior catalog seeded with predefined behaviors

## Test Scenario: Daily Pet Competition

### Step 1: Setup Test Environment (2 minutes)
```bash
# Start development environment
cd backend && just dev

# Verify behavior catalog is seeded
curl -H "Authorization: Bearer $TEST_TOKEN" \
  http://localhost:8080/api/behaviors | jq '.behaviors | length'
# Expected: At least 20 behaviors across categories

# Verify test pets and groups exist
curl -H "Authorization: Bearer $TEST_TOKEN" \
  http://localhost:8080/api/users/me/pets | jq '.pets[].name'
# Expected: ["Buddy", "Luna"] or similar test pets
```

### Step 2: Mobile App - Log Positive Behaviors (3 minutes)

**Action**: Open mobile app → Navigate to "Log Behavior" screen

1. **Select pet**: Tap "Buddy"
2. **Choose behavior**: Select "Went potty outside" (+5 points)
3. **Select groups**: Check "Family Group" and "Training Group"
4. **Add note**: "Good boy! First time outside today"
5. **Submit**: Tap "Log Behavior"

**Expected Results**:
- Success confirmation message appears
- Pet's score updates immediately in group rankings
- Both selected groups show the behavior in their feeds

### Step 3: API Validation - Real-time Rankings (2 minutes)
```bash
# Check if behavior was logged
curl -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:8080/api/behavior-logs?pet_id=$BUDDY_PET_ID&date_from=$(date +%Y-%m-%d)" \
  | jq '.behavior_logs[0].points_awarded'
# Expected: 5

# Verify group rankings updated
curl -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:8080/api/groups/$FAMILY_GROUP_ID/rankings" \
  | jq '.rankings[] | select(.pet_name == "Buddy") | .total_points'
# Expected: 5
```

### Step 4: Mobile App - Log Competing Pet (3 minutes)

**Action**: Switch to different pet in same group

1. **Select pet**: Tap "Luna"
2. **Choose behavior**: Select "Learned new trick" (+6 points)
3. **Select groups**: Check "Family Group" (same group as Buddy)
4. **Submit**: Tap "Log Behavior"

**Expected Results**:
- Luna now leads with 6 points
- Rankings update: Luna (1st - 6 pts), Buddy (2nd - 5 pts)
- Real-time leaderboard reflects change immediately

### Step 5: Test Duplicate Prevention (2 minutes)

**Action**: Try to log same behavior again immediately

1. **Select pet**: Tap "Luna"
2. **Choose behavior**: Select "Learned new trick" (same as before)
3. **Submit**: Tap "Log Behavior"

**Expected Results**:
- Error message: "Must wait 120 minutes before logging this behavior again"
- Behavior is not logged
- Rankings remain unchanged

### Step 6: Test Negative Behavior & Tie-Breaking (2 minutes)

**Action**: Log negative behavior to test tie-breaking logic

1. **Select pet**: Tap "Luna"
2. **Choose behavior**: Select "Indoor accident" (-3 points)
3. **Select groups**: Check "Family Group"
4. **Submit**: Tap "Log Behavior"

**Expected Results**:
- Luna's score: 6 + (-3) = 3 points, 1 negative behavior
- Buddy still has 5 points, 0 negative behaviors
- Rankings update: Buddy (1st), Luna (2nd)

### Step 7: End-of-Day Pet of the Day Selection (1 minute)
```bash
# Simulate daily reset trigger (normally automated at 9PM user time)
curl -X POST -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:8080/api/admin/trigger-daily-reset" \
  -d '{"group_ids":["'$FAMILY_GROUP_ID'"]}'

# Check Pet of the Day record was created
curl -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:8080/api/groups/$FAMILY_GROUP_ID/pet-of-the-day?date_from=$(date +%Y-%m-%d)" \
  | jq '.pet_of_the_day_records[0] | {pet_name, final_score, negative_behaviors}'
# Expected: {"pet_name": "Buddy", "final_score": 5, "negative_behaviors": 0}
```

## Success Criteria

### ✅ Functional Requirements Validated
- [x] **FR-001**: Users can log specific behaviors with point values
- [x] **FR-002**: Both positive and negative point values supported
- [x] **FR-003**: Real-time point accumulation and ranking within groups
- [x] **FR-004**: Users can select which groups receive each behavior
- [x] **FR-005**: Pet of the Day determined by highest score with tie-breaking
- [x] **FR-007**: Predefined behavior catalog with fixed point values
- [x] **FR-008**: Current rankings and point totals displayed to group members
- [x] **FR-010**: User can only log behaviors for pets they own/co-own
- [x] **FR-011**: Minimum time intervals enforced between same behaviors

### ✅ Performance Requirements
- [x] API responses < 200ms for ranking queries
- [x] Real-time updates appear within 2 seconds of logging
- [x] Mobile app remains responsive during behavior logging

### ✅ User Experience Requirements
- [x] Intuitive behavior selection interface
- [x] Clear success/error feedback messages
- [x] Real-time leaderboard updates
- [x] Proper handling of duplicate prevention

### ✅ Technical Requirements
- [x] Clean Architecture patterns followed
- [x] Comprehensive error handling
- [x] Data persistence and retrieval
- [x] Multi-group behavior sharing

## Troubleshooting

### Common Issues

**Issue**: "Behavior not found" error
**Solution**: Verify behavior catalog is seeded: `just seed` from backend directory

**Issue**: Rankings not updating in real-time
**Solution**: Check WebSocket connections are working, verify event bus system

**Issue**: Duplicate prevention not working
**Solution**: Verify system clock synchronization, check behavior min_interval_minutes

**Issue**: Pet of the Day logic incorrect
**Solution**: Verify tie-breaking logic considers negative behavior count, then multiple winners

## Performance Benchmarks

### API Response Times (Target: <200ms)
- Get behaviors catalog: ~50ms
- Log new behavior: ~100ms
- Get group rankings: ~75ms
- Get daily score summary: ~125ms

### Mobile App Performance
- Behavior logging screen load: <1 second
- Rankings update after logging: <2 seconds
- Smooth scrolling through behavior categories
- No memory leaks during extended use

## Test Data Cleanup
```bash
# Clean up test behavior logs
curl -X DELETE -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:8080/api/admin/test-data/behavior-logs"

# Reset daily scores for fresh testing
curl -X POST -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:8080/api/admin/reset-daily-scores"
```

## Next Steps After Quickstart
1. Run comprehensive test suite: `just test` (backend), `yarn test` (mobile)
2. Perform load testing with multiple concurrent users
3. Test timezone handling across different user timezones
4. Validate data retention policies (6-month cleanup)
5. Test WebSocket performance under high concurrency