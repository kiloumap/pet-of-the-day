# Quickstart: User Integration System

**Purpose**: Validate the user integration system implementation through comprehensive test scenarios based on user stories from the feature specification.

## Prerequisites

### Backend Setup
```bash
cd backend
just dev              # Start complete development environment
just seed             # Insert test data
```

### Mobile Setup
```bash
cd mobile
yarn install
yarn start            # Start Expo development server
yarn ios              # Run on iOS simulator (or yarn android)
```

### Verification
- Backend API accessible at http://localhost:8080
- Adminer (DB UI) at http://localhost:8081
- Mobile app running on simulator/device

## User Story Validation

### Story 1: New User Account Creation
**Given** a new user visits the platform
**When** they create an account with valid information
**Then** they can access their personal dashboard

**Test Steps**:
1. Open mobile app
2. Navigate to registration screen
3. Fill form with:
   - Email: `test@example.com`
   - Password: `SecurePass123!`
   - First Name: `John`
   - Last Name: `Doe`
4. Submit registration
5. Verify automatic login and dashboard access
6. Check backend database for user creation

**Expected Results**:
- User successfully registered and logged in
- Dashboard displays empty pet list with "Add Pet" option
- JWT token stored securely in device keychain
- User record created in database with hashed password

### Story 2: Pet Registration
**Given** an authenticated user
**When** they register a new pet with required information
**Then** the pet appears in their pet list as the primary owner

**Test Steps**:
1. From dashboard, tap "Add Pet"
2. Fill pet registration form:
   - Name: `Buddy`
   - Breed: `Golden Retriever`
   - Birth Date: `2020-05-15`
   - Photo: Upload test image (optional)
3. Submit registration
4. Verify pet appears in pet list
5. Check pet details show user as primary owner

**Expected Results**:
- Pet successfully created and linked to user
- Pet card displays in user's pet list
- Pet detail screen shows all information correctly
- Database contains pet record with correct owner relationship

### Story 3: Co-Owner Addition
**Given** a pet owner
**When** they add a co-owner to their pet
**Then** the co-owner can view and update the pet's information

**Test Steps**:
1. Select pet "Buddy" from pet list
2. Navigate to "Manage Co-Owners"
3. Add co-owner with email: `coowner@example.com`
4. Logout current user
5. Register/login as `coowner@example.com`
6. Verify pet "Buddy" appears in co-owned pets section
7. Open pet details and verify edit capabilities
8. Make a test edit (e.g., update breed to "Golden Retriever Mix")

**Expected Results**:
- Co-owner successfully added with appropriate permissions
- Co-owner can see and edit pet basic information
- Co-owner cannot manage other co-owners (only primary owner can)
- Changes made by co-owner are properly attributed

### Story 4: Personality Traits Management
**Given** an authorized user (owner or co-owner)
**When** they add personality traits to a pet
**Then** the traits are saved and visible to other authorized users

**Test Steps**:
1. Open pet "Buddy" details
2. Navigate to "Personality Traits" section
3. Add predefined trait: "Playful" with intensity 4
4. Add custom trait: "Loves swimming" with intensity 5
5. Save changes
6. Switch to co-owner account
7. Verify both traits are visible
8. Add another trait as co-owner: "Social" with intensity 3

**Expected Results**:
- Maximum 5 traits enforceable
- Both predefined and custom traits supported
- Intensity levels (1-5) properly validated
- All authorized users can view and add traits
- Attribution tracking shows who added each trait

### Story 5: Notebook Entry Creation
**Given** a pet with recorded information
**When** the owner creates notebook entries
**Then** the entries are saved and accessible to authorized users

**Test Steps**:
1. Open pet "Buddy" details
2. Navigate to "Notebook" section
3. Create Medical Entry:
   - Title: "Annual Checkup"
   - Date: Today's date
   - Veterinarian: "Dr. Smith"
   - Treatment: "Routine examination"
   - Cost: $150.00
   - Notes: "Healthy, recommended dental cleaning"
4. Create Diet Entry:
   - Title: "New Food Trial"
   - Date: Yesterday
   - Food Type: "Hill's Science Diet"
   - Quantity: "2 cups daily"
   - Reaction: "Good appetite, no digestive issues"
5. Create Habit Entry:
   - Title: "Morning Routine"
   - Behavior: "Fetches newspaper"
   - Frequency: "Daily"
   - Severity: 1 (positive behavior)
6. Create Command Entry:
   - Title: "Sit Command"
   - Command: "Sit"
   - Training Status: "Mastered"
   - Success Rate: 95%

**Expected Results**:
- All 4 entry types successfully created
- Entries display in chronological order
- Specialized fields properly captured for each type
- Tags and filtering work correctly
- Co-owners can view all entries

### Story 6: Notebook Sharing
**Given** a pet owner
**When** they share a pet's notebook with another user via email
**Then** the shared user can view (but not modify) the notebook contents

**Test Steps**:
1. From pet "Buddy" notebook
2. Tap "Share Notebook"
3. Enter email: `viewer@example.com`
4. Confirm sharing with read-only permissions
5. Check email notification sent (if configured)
6. Register/login as `viewer@example.com`
7. Check "Shared With Me" section
8. Open shared notebook for "Buddy"
9. Verify read-only access (no edit/delete buttons)
10. Attempt to create new entry (should fail)

**Expected Results**:
- Sharing successfully created with read-only permissions
- Shared user receives access without modification rights
- Sharing management allows revocation by owner
- Non-existent email handles gracefully
- Cannot share with self

## Edge Case Testing

### Duplicate Pet Names
**Test**: Register pet with same name as existing pet
**Expected**: Success (names only unique per owner)

### Co-Owner Management
**Test**: Co-owner tries to add another co-owner
**Expected**: Failure (only primary owner can manage co-owners)

### Personality Trait Limits
**Test**: Add 6th personality trait to pet
**Expected**: Validation error preventing addition

### Future Date Validation
**Test**: Create notebook entry with future date
**Expected**: Validation error

### Large File Upload
**Test**: Upload 20MB photo
**Expected**: Rejection with clear error message (15MB limit)

### Sharing Revocation
**Test**: Owner revokes notebook sharing
**Expected**: Shared user loses access immediately

## Performance Validation

### Response Time Testing
- User registration: < 200ms
- Pet creation: < 200ms
- Notebook entry creation: < 300ms
- Notebook loading (50 entries): < 500ms
- Image upload (10MB): < 5 seconds

### Mobile Performance
- App startup time: < 3 seconds
- Screen transitions: < 200ms
- List scrolling: 60fps
- Image loading: Progressive with placeholders

## Security Validation

### Authentication Testing
- Invalid credentials rejected
- JWT tokens expire appropriately
- Token refresh works seamlessly
- Logout clears all stored credentials

### Authorization Testing
- Users can only access their own pets
- Co-owners have appropriate permissions
- Shared users limited to read-only access
- Non-authenticated requests rejected

### Data Validation
- SQL injection attempts blocked
- File upload restrictions enforced
- Input sanitization prevents XSS
- Rate limiting protects against abuse

## Accessibility Testing

### Screen Reader Support
- All interactive elements properly labeled
- Navigation flows work with VoiceOver/TalkBack
- Form fields have descriptive labels
- Error messages clearly announced

### Visual Accessibility
- Sufficient color contrast ratios
- Text scales appropriately
- Touch targets meet minimum size requirements
- Dark mode fully supported

## Internationalization Testing

### Language Support
- Switch between English and French
- All text properly translated
- Date/time formats localized
- Input validation messages translated

### Cultural Considerations
- Pet naming conventions respected
- Date format preferences honored
- Currency display appropriate for locale

## Success Criteria

All user stories must complete successfully with:
- ✅ Expected results achieved
- ✅ Performance targets met
- ✅ Security validations passed
- ✅ Accessibility requirements satisfied
- ✅ Internationalization working correctly

## Troubleshooting

### Common Issues
1. **Backend not responding**: Verify Docker containers running
2. **Mobile app crashes**: Check React Native logs for errors
3. **Database connection**: Verify PostgreSQL service health
4. **Image uploads failing**: Check file size and format
5. **JWT errors**: Clear app storage and re-login

### Reset Instructions
```bash
# Complete database reset
cd backend
docker-compose down
docker volume rm backend_db_data
docker-compose up -d
just seed

# Mobile app reset
cd mobile
yarn clean
yarn start --clear
```

This quickstart validates the complete user integration system implementation through systematic testing of all user stories and edge cases defined in the feature specification.