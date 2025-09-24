import { apiService } from './api';
import { Pet, AddPetRequest, AddPetResponse, UpdatePetRequest, UpdatePetResponse, GetPetsResponse } from '../types/api';

export interface PetPersonalityTrait {
  id: string;
  name: string;
  description: string;
  level: number; // 1-5
  category: 'social' | 'energy' | 'training' | 'behavior';
}

export interface PetPersonality {
  petId: string;
  traits: PetPersonalityTrait[];
  notes?: string;
  lastUpdated: string;
}

export interface CoOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'co-owner';
  status: 'active' | 'pending' | 'inactive';
  addedAt: string;
}

export interface PetUploadResponse {
  photoUrl: string;
  thumbnailUrl?: string;
}

export class PetsService {
  // Pet CRUD operations
  async getAllPets(): Promise<Pet[]> {
    try {
      const response = await apiService.getPets();
      return response.pets || [];
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      throw error;
    }
  }

  async getPetById(petId: string): Promise<Pet> {
    try {
      return await apiService.getPetById(petId);
    } catch (error) {
      console.error(`Failed to fetch pet ${petId}:`, error);
      throw error;
    }
  }

  async createPet(petData: AddPetRequest): Promise<AddPetResponse> {
    try {
      const response = await apiService.addPet(petData);
      return response;
    } catch (error) {
      console.error('Failed to create pet:', error);
      throw error;
    }
  }

  async updatePet(petId: string, updates: Partial<Pet>): Promise<UpdatePetResponse> {
    try {
      const updateData: UpdatePetRequest = {
        petId,
        ...updates,
      };
      return await apiService.updatePet(updateData);
    } catch (error) {
      console.error(`Failed to update pet ${petId}:`, error);
      throw error;
    }
  }

  async deletePet(petId: string): Promise<void> {
    try {
      await apiService.deletePet(petId);
    } catch (error) {
      console.error(`Failed to delete pet ${petId}:`, error);
      throw error;
    }
  }

  // Pet photo management
  async uploadPetPhoto(petId: string, photoFile: any): Promise<PetUploadResponse> {
    try {
      const response = await apiService.uploadPetPhoto(petId, photoFile);
      return {
        photoUrl: response.photoUrl || response.photo_url,
        thumbnailUrl: response.thumbnailUrl || response.thumbnail_url,
      };
    } catch (error) {
      console.error(`Failed to upload photo for pet ${petId}:`, error);
      throw error;
    }
  }

  // Pet personality management
  async getPetPersonality(petId: string): Promise<PetPersonality> {
    try {
      const response = await apiService.getPetPersonality(petId);
      return {
        petId: response.pet_id || petId,
        traits: response.traits || [],
        notes: response.notes,
        lastUpdated: response.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to fetch personality for pet ${petId}:`, error);
      throw error;
    }
  }

  async updatePetPersonality(petId: string, personalityData: Partial<PetPersonality>): Promise<PetPersonality> {
    try {
      const updateData = {
        traits: personalityData.traits,
        notes: personalityData.notes,
      };
      const response = await apiService.updatePetPersonality(petId, updateData);
      return {
        petId: response.pet_id || petId,
        traits: response.traits || [],
        notes: response.notes,
        lastUpdated: response.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to update personality for pet ${petId}:`, error);
      throw error;
    }
  }

  // Co-owner management
  async getPetCoOwners(petId: string): Promise<CoOwner[]> {
    try {
      const response = await apiService.getPetCoOwners(petId);
      return response.coOwners || response.co_owners || [];
    } catch (error) {
      console.error(`Failed to fetch co-owners for pet ${petId}:`, error);
      throw error;
    }
  }

  async addCoOwner(petId: string, email: string): Promise<CoOwner> {
    try {
      const response = await apiService.addCoOwner(petId, { email });
      return {
        id: response.id,
        email: response.email,
        firstName: response.first_name || '',
        lastName: response.last_name || '',
        role: response.role || 'co-owner',
        status: response.status || 'pending',
        addedAt: response.added_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to add co-owner for pet ${petId}:`, error);
      throw error;
    }
  }

  async removeCoOwner(petId: string, userId: string): Promise<void> {
    try {
      await apiService.removeCoOwner(petId, userId);
    } catch (error) {
      console.error(`Failed to remove co-owner for pet ${petId}:`, error);
      throw error;
    }
  }

  // Pet statistics and insights
  async getPetStats(petId: string): Promise<any> {
    // This would aggregate stats from various sources
    try {
      const [pet, personality] = await Promise.all([
        this.getPetById(petId),
        this.getPetPersonality(petId).catch(() => null), // Optional data
      ]);

      return {
        basicInfo: {
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.birth_date ? this.calculateAge(pet.birth_date) : null,
        },
        personalityTraits: personality?.traits || [],
        // Add more stats as they become available
        activityLevel: this.calculateActivityLevel(personality?.traits || []),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to get stats for pet ${petId}:`, error);
      throw error;
    }
  }

  // Utility methods
  private calculateAge(birthDate: string): { years: number; months: number } {
    const birth = new Date(birthDate);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months };
  }

  private calculateActivityLevel(traits: PetPersonalityTrait[]): 'low' | 'medium' | 'high' {
    const energyTraits = traits.filter(trait => trait.category === 'energy');
    if (energyTraits.length === 0) return 'medium';

    const avgEnergyLevel = energyTraits.reduce((sum, trait) => sum + trait.level, 0) / energyTraits.length;

    if (avgEnergyLevel <= 2) return 'low';
    if (avgEnergyLevel >= 4) return 'high';
    return 'medium';
  }

  // Search and filter pets
  async searchPets(query: string): Promise<Pet[]> {
    try {
      const allPets = await this.getAllPets();
      return allPets.filter(pet =>
        pet.name.toLowerCase().includes(query.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(query.toLowerCase()) ||
        pet.species.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search pets:', error);
      throw error;
    }
  }

  async getPetsBySpecies(species: 'dog' | 'cat' | 'other'): Promise<Pet[]> {
    try {
      const allPets = await this.getAllPets();
      return allPets.filter(pet => pet.species === species);
    } catch (error) {
      console.error(`Failed to get pets by species ${species}:`, error);
      throw error;
    }
  }

  // Validation helpers
  validatePetData(petData: Partial<AddPetRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!petData.name?.trim()) {
      errors.push('Pet name is required');
    }

    if (!petData.species) {
      errors.push('Pet species is required');
    }

    if (petData.birth_date) {
      const birthDate = new Date(petData.birth_date);
      const now = new Date();
      if (birthDate > now) {
        errors.push('Birth date cannot be in the future');
      }
      if (birthDate.getFullYear() < 1900) {
        errors.push('Birth date seems too old');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const petsService = new PetsService();
export default petsService;