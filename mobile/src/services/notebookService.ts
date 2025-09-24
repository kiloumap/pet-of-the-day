import { apiService } from './api';

export interface Notebook {
  id: string;
  petId: string;
  name: string;
  description?: string;
  type: 'medical' | 'diet' | 'habits' | 'commands' | 'general';
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  entryCount?: number;
}

export interface NotebookEntry {
  id: string;
  notebookId: string;
  type: 'medical' | 'diet' | 'habits' | 'commands' | 'general';
  title: string;
  content: string;
  date: string;
  tags?: string[];
  attachments?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Specific entry types
export interface MedicalEntry extends NotebookEntry {
  type: 'medical';
  metadata: {
    veterinarian?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: string[];
    followUpDate?: string;
    symptoms?: string[];
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface DietEntry extends NotebookEntry {
  type: 'diet';
  metadata: {
    foodBrand?: string;
    portion?: string;
    calories?: number;
    ingredients?: string[];
    allergies?: string[];
    mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    weight?: number;
  };
}

export interface HabitEntry extends NotebookEntry {
  type: 'habits';
  metadata: {
    behavior: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
    duration?: string;
    location?: string;
    triggers?: string[];
    improvements?: string;
  };
}

export interface CommandEntry extends NotebookEntry {
  type: 'commands';
  metadata: {
    command: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    successRate?: number;
    trainingMethod?: string;
    rewards?: string[];
    sessions?: number;
    mastered?: boolean;
  };
}

export type AnyNotebookEntry = MedicalEntry | DietEntry | HabitEntry | CommandEntry | NotebookEntry;

export interface CreateNotebookRequest {
  name: string;
  description?: string;
  type: Notebook['type'];
}

export interface CreateEntryRequest {
  type: NotebookEntry['type'];
  title: string;
  content: string;
  date: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class NotebookService {
  // Notebook CRUD operations
  async getPetNotebooks(petId: string): Promise<Notebook[]> {
    try {
      const response = await apiService.getPetNotebooks(petId);
      return response.notebooks || [];
    } catch (error) {
      console.error(`Failed to fetch notebooks for pet ${petId}:`, error);
      throw error;
    }
  }

  async getNotebook(petId: string, notebookId: string): Promise<Notebook> {
    try {
      const response = await apiService.getNotebook(petId, notebookId);
      return response;
    } catch (error) {
      console.error(`Failed to fetch notebook ${notebookId}:`, error);
      throw error;
    }
  }

  async createNotebook(petId: string, notebookData: CreateNotebookRequest): Promise<Notebook> {
    try {
      const response = await apiService.createNotebook(petId, notebookData);
      return response;
    } catch (error) {
      console.error(`Failed to create notebook for pet ${petId}:`, error);
      throw error;
    }
  }

  async updateNotebook(petId: string, notebookId: string, updates: Partial<Notebook>): Promise<Notebook> {
    try {
      const response = await apiService.updateNotebook(petId, notebookId, updates);
      return response;
    } catch (error) {
      console.error(`Failed to update notebook ${notebookId}:`, error);
      throw error;
    }
  }

  async deleteNotebook(petId: string, notebookId: string): Promise<void> {
    try {
      await apiService.deleteNotebook(petId, notebookId);
    } catch (error) {
      console.error(`Failed to delete notebook ${notebookId}:`, error);
      throw error;
    }
  }

  // Entry CRUD operations
  async getNotebookEntries(petId: string, notebookId: string): Promise<AnyNotebookEntry[]> {
    try {
      const response = await apiService.getNotebookEntries(petId, notebookId);
      return response.entries || [];
    } catch (error) {
      console.error(`Failed to fetch entries for notebook ${notebookId}:`, error);
      throw error;
    }
  }

  async createEntry(petId: string, notebookId: string, entryData: CreateEntryRequest): Promise<AnyNotebookEntry> {
    try {
      const response = await apiService.createNotebookEntry(petId, notebookId, entryData);
      return response;
    } catch (error) {
      console.error(`Failed to create entry in notebook ${notebookId}:`, error);
      throw error;
    }
  }

  async updateEntry(
    petId: string,
    notebookId: string,
    entryId: string,
    updates: Partial<NotebookEntry>
  ): Promise<AnyNotebookEntry> {
    try {
      const response = await apiService.updateNotebookEntry(petId, notebookId, entryId, updates);
      return response;
    } catch (error) {
      console.error(`Failed to update entry ${entryId}:`, error);
      throw error;
    }
  }

  async deleteEntry(petId: string, notebookId: string, entryId: string): Promise<void> {
    try {
      await apiService.deleteNotebookEntry(petId, notebookId, entryId);
    } catch (error) {
      console.error(`Failed to delete entry ${entryId}:`, error);
      throw error;
    }
  }

  // Specialized entry creation helpers
  async createMedicalEntry(
    petId: string,
    notebookId: string,
    data: {
      title: string;
      content: string;
      date: string;
      veterinarian?: string;
      diagnosis?: string;
      treatment?: string;
      medications?: string[];
      followUpDate?: string;
      symptoms?: string[];
      severity?: MedicalEntry['metadata']['severity'];
    }
  ): Promise<MedicalEntry> {
    const entryData: CreateEntryRequest = {
      type: 'medical',
      title: data.title,
      content: data.content,
      date: data.date,
      metadata: {
        veterinarian: data.veterinarian,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        medications: data.medications,
        followUpDate: data.followUpDate,
        symptoms: data.symptoms,
        severity: data.severity,
      },
    };

    return this.createEntry(petId, notebookId, entryData) as Promise<MedicalEntry>;
  }

  async createDietEntry(
    petId: string,
    notebookId: string,
    data: {
      title: string;
      content: string;
      date: string;
      foodBrand?: string;
      portion?: string;
      calories?: number;
      ingredients?: string[];
      allergies?: string[];
      mealTime?: DietEntry['metadata']['mealTime'];
      weight?: number;
    }
  ): Promise<DietEntry> {
    const entryData: CreateEntryRequest = {
      type: 'diet',
      title: data.title,
      content: data.content,
      date: data.date,
      metadata: {
        foodBrand: data.foodBrand,
        portion: data.portion,
        calories: data.calories,
        ingredients: data.ingredients,
        allergies: data.allergies,
        mealTime: data.mealTime,
        weight: data.weight,
      },
    };

    return this.createEntry(petId, notebookId, entryData) as Promise<DietEntry>;
  }

  async createHabitEntry(
    petId: string,
    notebookId: string,
    data: {
      title: string;
      content: string;
      date: string;
      behavior: string;
      frequency: HabitEntry['metadata']['frequency'];
      duration?: string;
      location?: string;
      triggers?: string[];
      improvements?: string;
    }
  ): Promise<HabitEntry> {
    const entryData: CreateEntryRequest = {
      type: 'habits',
      title: data.title,
      content: data.content,
      date: data.date,
      metadata: {
        behavior: data.behavior,
        frequency: data.frequency,
        duration: data.duration,
        location: data.location,
        triggers: data.triggers,
        improvements: data.improvements,
      },
    };

    return this.createEntry(petId, notebookId, entryData) as Promise<HabitEntry>;
  }

  async createCommandEntry(
    petId: string,
    notebookId: string,
    data: {
      title: string;
      content: string;
      date: string;
      command: string;
      difficulty: CommandEntry['metadata']['difficulty'];
      successRate?: number;
      trainingMethod?: string;
      rewards?: string[];
      sessions?: number;
      mastered?: boolean;
    }
  ): Promise<CommandEntry> {
    const entryData: CreateEntryRequest = {
      type: 'commands',
      title: data.title,
      content: data.content,
      date: data.date,
      metadata: {
        command: data.command,
        difficulty: data.difficulty,
        successRate: data.successRate,
        trainingMethod: data.trainingMethod,
        rewards: data.rewards,
        sessions: data.sessions,
        mastered: data.mastered,
      },
    };

    return this.createEntry(petId, notebookId, entryData) as Promise<CommandEntry>;
  }

  // Search and filtering
  async searchEntries(
    petId: string,
    notebookId: string,
    query: string,
    filters?: {
      type?: NotebookEntry['type'];
      dateFrom?: string;
      dateTo?: string;
      tags?: string[];
    }
  ): Promise<AnyNotebookEntry[]> {
    try {
      const allEntries = await this.getNotebookEntries(petId, notebookId);

      let filteredEntries = allEntries.filter(entry =>
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        entry.content.toLowerCase().includes(query.toLowerCase())
      );

      if (filters) {
        if (filters.type) {
          filteredEntries = filteredEntries.filter(entry => entry.type === filters.type);
        }

        if (filters.dateFrom) {
          filteredEntries = filteredEntries.filter(entry => entry.date >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          filteredEntries = filteredEntries.filter(entry => entry.date <= filters.dateTo!);
        }

        if (filters.tags && filters.tags.length > 0) {
          filteredEntries = filteredEntries.filter(entry =>
            entry.tags?.some(tag => filters.tags!.includes(tag))
          );
        }
      }

      return filteredEntries;
    } catch (error) {
      console.error('Failed to search entries:', error);
      throw error;
    }
  }

  async getEntriesByType(petId: string, notebookId: string, type: NotebookEntry['type']): Promise<AnyNotebookEntry[]> {
    try {
      const allEntries = await this.getNotebookEntries(petId, notebookId);
      return allEntries.filter(entry => entry.type === type);
    } catch (error) {
      console.error(`Failed to get ${type} entries:`, error);
      throw error;
    }
  }

  async getRecentEntries(petId: string, notebookId: string, limit: number = 10): Promise<AnyNotebookEntry[]> {
    try {
      const allEntries = await this.getNotebookEntries(petId, notebookId);
      return allEntries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent entries:', error);
      throw error;
    }
  }

  // Statistics and insights
  async getNotebookStats(petId: string, notebookId: string): Promise<{
    totalEntries: number;
    entriesByType: Record<string, number>;
    recentActivity: { date: string; count: number }[];
    tags: { tag: string; count: number }[];
  }> {
    try {
      const entries = await this.getNotebookEntries(petId, notebookId);

      const entriesByType = entries.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by date for recent activity
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      const recentActivity = last30Days.map(date => ({
        date,
        count: entries.filter(entry => entry.date.startsWith(date)).length,
      }));

      // Count tags
      const tagCount = entries
        .flatMap(entry => entry.tags || [])
        .reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const tags = Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalEntries: entries.length,
        entriesByType,
        recentActivity,
        tags,
      };
    } catch (error) {
      console.error('Failed to get notebook stats:', error);
      throw error;
    }
  }

  // Validation helpers
  validateNotebookData(data: CreateNotebookRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Notebook name is required');
    }

    if (!['medical', 'diet', 'habits', 'commands', 'general'].includes(data.type)) {
      errors.push('Invalid notebook type');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateEntryData(data: CreateEntryRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Entry title is required');
    }

    if (!data.content?.trim()) {
      errors.push('Entry content is required');
    }

    if (!data.date) {
      errors.push('Entry date is required');
    } else {
      const entryDate = new Date(data.date);
      const now = new Date();
      if (entryDate > now) {
        errors.push('Entry date cannot be in the future');
      }
    }

    if (!['medical', 'diet', 'habits', 'commands', 'general'].includes(data.type)) {
      errors.push('Invalid entry type');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const notebookService = new NotebookService();
export default notebookService;