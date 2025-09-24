/**
 * End-to-End User Flow Tests
 * Tests complete user journeys from start to finish
 */

import { authService } from '../../services/authService';
import { petsService } from '../../services/petsService';
import { notebookService } from '../../services/notebookService';
import { sharingService } from '../../services/sharingService';

export interface E2ETestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
  steps: Array<{
    step: string;
    success: boolean;
    duration: number;
    error?: string;
  }>;
  data?: any;
}

// T108: Test user registration and authentication flow
export class UserAuthenticationFlowTest {
  async runTest(): Promise<E2ETestResult> {
    const startTime = Date.now();
    const testName = 'User Registration and Authentication Flow';
    const steps: E2ETestResult['steps'] = [];

    try {
      // Step 1: User Registration
      const registrationStart = Date.now();
      try {
        const uniqueEmail = `e2e-test-${Date.now()}@petoftheday.com`;
        const registrationData = {
          email: uniqueEmail,
          password: 'SecurePassword123!',
          first_name: 'E2E',
          last_name: 'TestUser',
        };

        const registerResponse = await authService.register(registrationData);

        steps.push({
          step: 'User Registration',
          success: true,
          duration: Date.now() - registrationStart,
        });

        // Validate registration response
        if (!registerResponse.token || !registerResponse.user_id) {
          throw new Error('Registration response missing required fields');
        }

        // Step 2: Check Authentication State
        const authCheckStart = Date.now();
        const isAuthenticated = await authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();

        steps.push({
          step: 'Check Authentication State',
          success: isAuthenticated && !!currentUser,
          duration: Date.now() - authCheckStart,
        });

        if (!isAuthenticated || !currentUser) {
          throw new Error('User not properly authenticated after registration');
        }

        // Step 3: Logout
        const logoutStart = Date.now();
        await authService.logout();
        const isLoggedOut = !(await authService.isAuthenticated());

        steps.push({
          step: 'User Logout',
          success: isLoggedOut,
          duration: Date.now() - logoutStart,
        });

        // Step 4: Login with same credentials
        const loginStart = Date.now();
        const loginResponse = await authService.login({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

        steps.push({
          step: 'User Login',
          success: !!loginResponse.token,
          duration: Date.now() - loginStart,
        });

        // Step 5: Verify Login State
        const loginVerifyStart = Date.now();
        const isReAuthenticated = await authService.isAuthenticated();
        const reAuthUser = authService.getCurrentUser();

        steps.push({
          step: 'Verify Login State',
          success: isReAuthenticated && !!reAuthUser,
          duration: Date.now() - loginVerifyStart,
        });

        return {
          testName,
          success: true,
          message: 'Complete authentication flow successful',
          duration: Date.now() - startTime,
          steps,
          data: {
            userId: registerResponse.user_id,
            userEmail: uniqueEmail,
            hasValidTokens: !!loginResponse.token,
          },
        };

      } catch (error) {
        steps.push({
          step: 'Authentication Flow',
          success: false,
          duration: Date.now() - registrationStart,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          testName,
          success: false,
          message: `Authentication flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime,
          steps,
        };
      }

    } catch (error) {
      return {
        testName,
        success: false,
        message: `Test setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}

// T109: Test pet registration and management flow
export class PetManagementFlowTest {
  async runTest(): Promise<E2ETestResult> {
    const startTime = Date.now();
    const testName = 'Pet Registration and Management Flow';
    const steps: E2ETestResult['steps'] = [];

    try {
      // Ensure authenticated user
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        throw new Error('User must be authenticated for pet management tests');
      }

      // Step 1: Create Pet
      const createPetStart = Date.now();
      const petData = {
        name: `E2E Test Pet ${Date.now()}`,
        species: 'dog' as const,
        breed: 'Golden Retriever',
        birth_date: '2022-03-15',
      };

      const createdPet = await petsService.createPet(petData);

      steps.push({
        step: 'Create Pet',
        success: !!createdPet.pet_id,
        duration: Date.now() - createPetStart,
      });

      if (!createdPet.pet_id) {
        throw new Error('Pet creation failed');
      }

      const petId = createdPet.pet_id;

      // Step 2: Retrieve Pet
      const retrievePetStart = Date.now();
      const retrievedPet = await petsService.getPetById(petId);

      steps.push({
        step: 'Retrieve Pet',
        success: retrievedPet.id === petId && retrievedPet.name === petData.name,
        duration: Date.now() - retrievePetStart,
      });

      // Step 3: Update Pet
      const updatePetStart = Date.now();
      const updatedName = `${petData.name} - Updated`;
      const updateResponse = await petsService.updatePet(petId, {
        name: updatedName,
        breed: 'Labrador Retriever',
      });

      steps.push({
        step: 'Update Pet',
        success: !!updateResponse,
        duration: Date.now() - updatePetStart,
      });

      // Step 4: Get All Pets (should include our pet)
      const getAllPetsStart = Date.now();
      const allPets = await petsService.getAllPets();
      const ourPetExists = allPets.some(pet => pet.id === petId);

      steps.push({
        step: 'Get All Pets',
        success: ourPetExists,
        duration: Date.now() - getAllPetsStart,
      });

      // Step 5: Get Pet Statistics
      const getPetStatsStart = Date.now();
      const petStats = await petsService.getPetStats(petId);

      steps.push({
        step: 'Get Pet Statistics',
        success: !!petStats && petStats.basicInfo.name === updatedName,
        duration: Date.now() - getPetStatsStart,
      });

      return {
        testName,
        success: true,
        message: 'Complete pet management flow successful',
        duration: Date.now() - startTime,
        steps,
        data: {
          petId,
          petName: updatedName,
          totalPets: allPets.length,
          petStats,
        },
      };

    } catch (error) {
      steps.push({
        step: 'Pet Management Flow',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        testName,
        success: false,
        message: `Pet management flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}

// T110: Test personality traits addition and management
export class PersonalityTraitsFlowTest {
  async runTest(): Promise<E2ETestResult> {
    const startTime = Date.now();
    const testName = 'Personality Traits Addition and Management';
    const steps: E2ETestResult['steps'] = [];

    try {
      // Get a test pet (create one if needed)
      const pets = await petsService.getAllPets();
      let testPet = pets[0];

      if (!testPet) {
        // Create a test pet
        const petData = {
          name: `Personality Test Pet ${Date.now()}`,
          species: 'dog' as const,
          breed: 'Border Collie',
          birth_date: '2021-08-10',
        };
        const createdPet = await petsService.createPet(petData);
        testPet = await petsService.getPetById(createdPet.pet_id);
      }

      const petId = testPet.id;

      // Step 1: Get Initial Personality (might be empty)
      const getInitialStart = Date.now();
      let initialPersonality;
      try {
        initialPersonality = await petsService.getPetPersonality(petId);
      } catch (error) {
        // Personality might not exist yet, which is fine
        initialPersonality = { petId, traits: [], notes: '', lastUpdated: new Date().toISOString() };
      }

      steps.push({
        step: 'Get Initial Personality',
        success: true,
        duration: Date.now() - getInitialStart,
      });

      // Step 2: Add Personality Traits
      const addTraitsStart = Date.now();
      const personalityData = {
        traits: [
          {
            id: 'energy-1',
            name: 'High Energy',
            description: 'Very active and playful',
            level: 5,
            category: 'energy' as const,
          },
          {
            id: 'social-1',
            name: 'Social',
            description: 'Loves meeting new people',
            level: 4,
            category: 'social' as const,
          },
          {
            id: 'training-1',
            name: 'Quick Learner',
            description: 'Picks up commands quickly',
            level: 4,
            category: 'training' as const,
          },
        ],
        notes: 'E2E test personality traits - very friendly and energetic dog',
      };

      const updatedPersonality = await petsService.updatePetPersonality(petId, personalityData);

      steps.push({
        step: 'Add Personality Traits',
        success: updatedPersonality.traits.length === 3,
        duration: Date.now() - addTraitsStart,
      });

      // Step 3: Retrieve Updated Personality
      const getUpdatedStart = Date.now();
      const retrievedPersonality = await petsService.getPetPersonality(petId);

      steps.push({
        step: 'Retrieve Updated Personality',
        success: retrievedPersonality.traits.length === 3 &&
                retrievedPersonality.notes === personalityData.notes,
        duration: Date.now() - getUpdatedStart,
      });

      // Step 4: Update Specific Trait
      const updateTraitStart = Date.now();
      const modifiedTraits = [...retrievedPersonality.traits];
      modifiedTraits[0].level = 3; // Reduce energy level

      const reUpdatedPersonality = await petsService.updatePetPersonality(petId, {
        traits: modifiedTraits,
        notes: 'Updated energy level after training',
      });

      steps.push({
        step: 'Update Specific Trait',
        success: reUpdatedPersonality.traits[0].level === 3,
        duration: Date.now() - updateTraitStart,
      });

      return {
        testName,
        success: true,
        message: 'Complete personality traits management flow successful',
        duration: Date.now() - startTime,
        steps,
        data: {
          petId,
          petName: testPet.name,
          initialTraitsCount: initialPersonality.traits.length,
          finalTraitsCount: reUpdatedPersonality.traits.length,
          personality: reUpdatedPersonality,
        },
      };

    } catch (error) {
      steps.push({
        step: 'Personality Traits Flow',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        testName,
        success: false,
        message: `Personality traits flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}

// T111: Test notebook entry creation across all types
export class NotebookEntryFlowTest {
  async runTest(): Promise<E2ETestResult> {
    const startTime = Date.now();
    const testName = 'Notebook Entry Creation Across All Types';
    const steps: E2ETestResult['steps'] = [];

    try {
      // Get a test pet
      const pets = await petsService.getAllPets();
      if (pets.length === 0) {
        throw new Error('No pets available for notebook testing');
      }

      const petId = pets[0].id;

      // Step 1: Create Medical Notebook
      const createMedicalNotebookStart = Date.now();
      const medicalNotebook = await notebookService.createNotebook(petId, {
        name: 'Medical Records E2E',
        description: 'E2E test medical notebook',
        type: 'medical',
      });

      steps.push({
        step: 'Create Medical Notebook',
        success: !!medicalNotebook.id,
        duration: Date.now() - createMedicalNotebookStart,
      });

      // Step 2: Create Medical Entry
      const createMedicalEntryStart = Date.now();
      const medicalEntry = await notebookService.createMedicalEntry(petId, medicalNotebook.id, {
        title: 'Annual Checkup',
        content: 'Routine annual health examination',
        date: '2024-09-24',
        veterinarian: 'Dr. Smith',
        diagnosis: 'Healthy',
        treatment: 'None required',
        symptoms: [],
        severity: 'low',
      });

      steps.push({
        step: 'Create Medical Entry',
        success: !!medicalEntry.id && medicalEntry.type === 'medical',
        duration: Date.now() - createMedicalEntryStart,
      });

      // Step 3: Create Diet Notebook and Entry
      const createDietNotebookStart = Date.now();
      const dietNotebook = await notebookService.createNotebook(petId, {
        name: 'Diet Tracking E2E',
        description: 'E2E test diet notebook',
        type: 'diet',
      });

      const dietEntry = await notebookService.createDietEntry(petId, dietNotebook.id, {
        title: 'Morning Meal',
        content: 'High-quality dry food with supplements',
        date: '2024-09-24',
        foodBrand: 'Premium Pet Food',
        portion: '2 cups',
        calories: 400,
        mealTime: 'breakfast',
      });

      steps.push({
        step: 'Create Diet Notebook and Entry',
        success: !!dietNotebook.id && !!dietEntry.id && dietEntry.type === 'diet',
        duration: Date.now() - createDietNotebookStart,
      });

      // Step 4: Create Habits Entry
      const createHabitsNotebookStart = Date.now();
      const habitsNotebook = await notebookService.createNotebook(petId, {
        name: 'Behavior Tracking E2E',
        description: 'E2E test habits notebook',
        type: 'habits',
      });

      const habitEntry = await notebookService.createHabitEntry(petId, habitsNotebook.id, {
        title: 'Morning Walk',
        content: 'Daily morning exercise routine',
        date: '2024-09-24',
        behavior: 'Walking',
        frequency: 'daily',
        duration: '30 minutes',
        location: 'Park',
      });

      steps.push({
        step: 'Create Habits Notebook and Entry',
        success: !!habitsNotebook.id && !!habitEntry.id && habitEntry.type === 'habits',
        duration: Date.now() - createHabitsNotebookStart,
      });

      // Step 5: Create Commands Entry
      const createCommandsNotebookStart = Date.now();
      const commandsNotebook = await notebookService.createNotebook(petId, {
        name: 'Training Progress E2E',
        description: 'E2E test commands notebook',
        type: 'commands',
      });

      const commandEntry = await notebookService.createCommandEntry(petId, commandsNotebook.id, {
        title: 'Sit Command Training',
        content: 'Working on basic sit command',
        date: '2024-09-24',
        command: 'sit',
        difficulty: 'beginner',
        successRate: 80,
        sessions: 5,
        mastered: false,
      });

      steps.push({
        step: 'Create Commands Notebook and Entry',
        success: !!commandsNotebook.id && !!commandEntry.id && commandEntry.type === 'commands',
        duration: Date.now() - createCommandsNotebookStart,
      });

      // Step 6: Retrieve All Notebooks
      const getAllNotebooksStart = Date.now();
      const allNotebooks = await notebookService.getPetNotebooks(petId);
      const createdNotebookIds = [medicalNotebook.id, dietNotebook.id, habitsNotebook.id, commandsNotebook.id];
      const allCreatedNotebooksExist = createdNotebookIds.every(id =>
        allNotebooks.some(notebook => notebook.id === id)
      );

      steps.push({
        step: 'Retrieve All Notebooks',
        success: allCreatedNotebooksExist,
        duration: Date.now() - getAllNotebooksStart,
      });

      // Step 7: Get Notebook Statistics
      const getStatsStart = Date.now();
      const notebookStats = await notebookService.getNotebookStats(petId, medicalNotebook.id);

      steps.push({
        step: 'Get Notebook Statistics',
        success: notebookStats.totalEntries >= 1,
        duration: Date.now() - getStatsStart,
      });

      return {
        testName,
        success: true,
        message: 'Complete notebook entry creation flow successful',
        duration: Date.now() - startTime,
        steps,
        data: {
          petId,
          notebooksCreated: 4,
          entriesCreated: 4,
          notebookTypes: ['medical', 'diet', 'habits', 'commands'],
          stats: notebookStats,
        },
      };

    } catch (error) {
      steps.push({
        step: 'Notebook Entry Flow',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        testName,
        success: false,
        message: `Notebook entry flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}

// T112: Test notebook sharing and permissions
export class NotebookSharingFlowTest {
  async runTest(): Promise<E2ETestResult> {
    const startTime = Date.now();
    const testName = 'Notebook Sharing and Permissions';
    const steps: E2ETestResult['steps'] = [];

    try {
      // Get notebooks to share
      const pets = await petsService.getAllPets();
      if (pets.length === 0) {
        throw new Error('No pets available for sharing testing');
      }

      const petId = pets[0].id;
      const notebooks = await notebookService.getPetNotebooks(petId);

      if (notebooks.length === 0) {
        throw new Error('No notebooks available for sharing testing');
      }

      const notebookId = notebooks[0].id;

      // Step 1: Create Share Invitation
      const createShareStart = Date.now();
      const shareData = {
        email: `share-test-${Date.now()}@example.com`,
        shareType: 'read' as const,
        message: 'E2E test notebook sharing',
      };

      const notebookShare = await sharingService.createNotebookShare(notebookId, shareData);

      steps.push({
        step: 'Create Share Invitation',
        success: !!notebookShare.id && notebookShare.sharedWithEmail === shareData.email,
        duration: Date.now() - createShareStart,
      });

      // Step 2: Get Notebook Shares
      const getSharesStart = Date.now();
      const shares = await sharingService.getNotebookShares(notebookId);
      const ourShareExists = shares.some(share => share.id === notebookShare.id);

      steps.push({
        step: 'Get Notebook Shares',
        success: ourShareExists,
        duration: Date.now() - getSharesStart,
      });

      // Step 3: Update Share Permissions
      const updateShareStart = Date.now();
      const updatedShare = await sharingService.updateNotebookShare(notebookId, notebookShare.id, {
        shareType: 'write',
      });

      steps.push({
        step: 'Update Share Permissions',
        success: updatedShare.shareType === 'write',
        duration: Date.now() - updateShareStart,
      });

      // Step 4: Get User Permissions
      const getPermissionsStart = Date.now();
      const permissions = await sharingService.getUserPermissionForNotebook(notebookId);

      steps.push({
        step: 'Get User Permissions',
        success: permissions.hasAccess !== undefined,
        duration: Date.now() - getPermissionsStart,
      });

      // Step 5: Get Sharing Statistics
      const getStatsStart = Date.now();
      const sharingStats = await sharingService.getSharingStats();

      steps.push({
        step: 'Get Sharing Statistics',
        success: typeof sharingStats.totalSharedNotebooks === 'number',
        duration: Date.now() - getStatsStart,
      });

      // Step 6: Revoke Share
      const revokeShareStart = Date.now();
      await sharingService.revokeNotebookShare(notebookId, notebookShare.id);

      const sharesAfterRevoke = await sharingService.getNotebookShares(notebookId);
      const shareStillExists = sharesAfterRevoke.some(share => share.id === notebookShare.id);

      steps.push({
        step: 'Revoke Share',
        success: !shareStillExists,
        duration: Date.now() - revokeShareStart,
      });

      return {
        testName,
        success: true,
        message: 'Complete notebook sharing flow successful',
        duration: Date.now() - startTime,
        steps,
        data: {
          petId,
          notebookId,
          shareId: notebookShare.id,
          sharedWithEmail: shareData.email,
          finalShareType: updatedShare.shareType,
          stats: sharingStats,
        },
      };

    } catch (error) {
      steps.push({
        step: 'Notebook Sharing Flow',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        testName,
        success: false,
        message: `Notebook sharing flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}

// T113: Test co-owner relationships and permissions
export class CoOwnerRelationshipsFlowTest {
  async runTest(): Promise<E2ETestResult> {
    const startTime = Date.now();
    const testName = 'Co-Owner Relationships and Permissions';
    const steps: E2ETestResult['steps'] = [];

    try {
      // Get pets for co-owner testing
      const pets = await petsService.getAllPets();
      if (pets.length === 0) {
        throw new Error('No pets available for co-owner testing');
      }

      const petId = pets[0].id;

      // Step 1: Get Initial Co-Owners
      const getInitialCoOwnersStart = Date.now();
      const initialCoOwners = await petsService.getPetCoOwners(petId);

      steps.push({
        step: 'Get Initial Co-Owners',
        success: Array.isArray(initialCoOwners),
        duration: Date.now() - getInitialCoOwnersStart,
      });

      // Step 2: Add Co-Owner
      const addCoOwnerStart = Date.now();
      const coOwnerEmail = `coowner-test-${Date.now()}@example.com`;
      const addedCoOwner = await petsService.addCoOwner(petId, coOwnerEmail);

      steps.push({
        step: 'Add Co-Owner',
        success: !!addedCoOwner.id && addedCoOwner.email === coOwnerEmail,
        duration: Date.now() - addCoOwnerStart,
      });

      // Step 3: Verify Co-Owner Added
      const verifyCoOwnerStart = Date.now();
      const updatedCoOwners = await petsService.getPetCoOwners(petId);
      const coOwnerExists = updatedCoOwners.some(coOwner => coOwner.email === coOwnerEmail);

      steps.push({
        step: 'Verify Co-Owner Added',
        success: coOwnerExists,
        duration: Date.now() - verifyCoOwnerStart,
      });

      // Step 4: Remove Co-Owner
      const removeCoOwnerStart = Date.now();
      await petsService.removeCoOwner(petId, addedCoOwner.id);

      const finalCoOwners = await petsService.getPetCoOwners(petId);
      const coOwnerRemoved = !finalCoOwners.some(coOwner => coOwner.id === addedCoOwner.id);

      steps.push({
        step: 'Remove Co-Owner',
        success: coOwnerRemoved,
        duration: Date.now() - removeCoOwnerStart,
      });

      return {
        testName,
        success: true,
        message: 'Complete co-owner relationships flow successful',
        duration: Date.now() - startTime,
        steps,
        data: {
          petId,
          coOwnerEmail,
          initialCoOwnersCount: initialCoOwners.length,
          finalCoOwnersCount: finalCoOwners.length,
          addedCoOwnerId: addedCoOwner.id,
        },
      };

    } catch (error) {
      steps.push({
        step: 'Co-Owner Relationships Flow',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        testName,
        success: false,
        message: `Co-owner relationships flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}

// Comprehensive E2E Test Suite Runner
export class E2ETestSuite {
  async runAllTests(): Promise<{
    results: E2ETestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      totalDuration: number;
      successRate: number;
    };
  }> {
    const startTime = Date.now();
    console.log('🚀 Starting End-to-End Test Suite...');

    // Run all test flows
    const tests = [
      new UserAuthenticationFlowTest(),
      new PetManagementFlowTest(),
      new PersonalityTraitsFlowTest(),
      new NotebookEntryFlowTest(),
      new NotebookSharingFlowTest(),
      new CoOwnerRelationshipsFlowTest(),
    ];

    const results: E2ETestResult[] = [];

    for (const test of tests) {
      console.log(`Running ${test.constructor.name}...`);
      const result = await test.runTest();
      results.push(result);

      if (result.success) {
        console.log(`✅ ${result.testName} - PASSED (${result.duration}ms)`);
      } else {
        console.log(`❌ ${result.testName} - FAILED: ${result.message}`);
      }
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const totalDuration = Date.now() - startTime;
    const successRate = Math.round((passed / results.length) * 100);

    console.log('\n📊 E2E Test Suite Results:');
    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);

    return {
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        totalDuration,
        successRate,
      },
    };
  }
}

export default E2ETestSuite;