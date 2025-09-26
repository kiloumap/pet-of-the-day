import {
  Behavior,
  BehaviorLog,
  CreateBehaviorLogRequest,
  UpdateBehaviorLogRequest,
  BehaviorLogFilter,
  PetRanking,
  PetOfTheDayWinner,
  DailyScore,
} from '../types/behavior';
import { apiService } from './api';

class BehaviorService {
  private baseUrl = '/api';

  /**
   * Get all available behaviors, optionally filtered by species and category
   */
  async getBehaviors(params?: { species?: string; category?: string }): Promise<Behavior[]> {
    const queryParams = new URLSearchParams();
    if (params?.species) {
      queryParams.append('species', params.species);
    }
    if (params?.category) {
      queryParams.append('category', params.category);
    }

    const url = `${this.baseUrl}/behaviors${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await apiService.get<Behavior[]>(url);
  }

  /**
   * Create a new behavior log entry
   */
  async createBehaviorLog(request: CreateBehaviorLogRequest): Promise<BehaviorLog> {
    return await apiService.post<BehaviorLog>(`${this.baseUrl}/behavior-logs`, request);
  }

  /**
   * Get behavior logs with optional filtering
   */
  async getBehaviorLogs(filter: BehaviorLogFilter): Promise<BehaviorLog[]> {
    const queryParams = new URLSearchParams();
    
    if (filter.petId) {
      queryParams.append('pet_id', filter.petId);
    }
    if (filter.behaviorId) {
      queryParams.append('behavior_id', filter.behaviorId);
    }
    if (filter.groupId) {
      queryParams.append('group_id', filter.groupId);
    }
    if (filter.dateFrom) {
      queryParams.append('date_from', this.formatDateForAPI(filter.dateFrom));
    }
    if (filter.dateTo) {
      queryParams.append('date_to', this.formatDateForAPI(filter.dateTo));
    }
    if (filter.limit !== undefined) {
      queryParams.append('limit', filter.limit.toString());
    }
    if (filter.offset !== undefined) {
      queryParams.append('offset', filter.offset.toString());
    }

    const url = `${this.baseUrl}/behavior-logs?${queryParams}`;
    return await apiService.get<BehaviorLog[]>(url);
  }

  /**
   * Update an existing behavior log
   */
  async updateBehaviorLog(id: string, request: UpdateBehaviorLogRequest): Promise<BehaviorLog> {
    return await apiService.put<BehaviorLog>(`${this.baseUrl}/behavior-logs/${id}`, request);
  }

  /**
   * Delete a behavior log
   */
  async deleteBehaviorLog(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/behavior-logs/${id}`);
  }

  /**
   * Get current rankings for a group on a specific date
   */
  async getGroupRankings(groupId: string, date?: string): Promise<PetRanking[]> {
    const queryParams = new URLSearchParams();
    if (date) {
      queryParams.append('date', date);
    }

    const url = `${this.baseUrl}/groups/${groupId}/rankings${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await apiService.get<PetRanking[]>(url);
  }

  /**
   * Get Pet of the Day winner(s) for a group on a specific date
   */
  async getPetOfTheDay(groupId: string, date?: string): Promise<PetOfTheDayWinner | null> {
    const queryParams = new URLSearchParams();
    if (date) {
      queryParams.append('date', date);
    }

    const url = `${this.baseUrl}/groups/${groupId}/pet-of-the-day${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    try {
      const winners = await apiService.get<PetOfTheDayWinner[]>(url);
      // Return the first winner if any exist (most common case)
      return winners.length > 0 ? winners[0] : null;
    } catch (error: any) {
      // Pet of the Day not being available is not necessarily an error
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get Pet of the Day history for a group
   */
  async getPetOfTheDayHistory(groupId: string, fromDate?: string, toDate?: string): Promise<PetOfTheDayWinner[]> {
    const queryParams = new URLSearchParams();
    if (fromDate) {
      queryParams.append('from', fromDate);
    }
    if (toDate) {
      queryParams.append('to', toDate);
    }

    const url = `${this.baseUrl}/groups/${groupId}/pet-of-the-day/history${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await apiService.get<PetOfTheDayWinner[]>(url);
  }

  /**
   * Get daily score for a specific pet in a group on a specific date
   */
  async getDailyScore(petId: string, groupId: string, date?: string): Promise<DailyScore> {
    const queryParams = new URLSearchParams();
    queryParams.append('group_id', groupId);
    if (date) {
      queryParams.append('date', date);
    }

    const url = `${this.baseUrl}/pets/${petId}/daily-score?${queryParams}`;
    return await apiService.get<DailyScore>(url);
  }

  /**
   * Get daily score breakdown for a pet
   */
  async getDailyScoreBreakdown(petId: string, groupId: string, date?: string): Promise<DailyScore & { breakdown: any[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('group_id', groupId);
    queryParams.append('include_breakdown', 'true');
    if (date) {
      queryParams.append('date', date);
    }

    const url = `${this.baseUrl}/pets/${petId}/daily-score?${queryParams}`;
    return await apiService.get<DailyScore & { breakdown: any[] }>(url);
  }

  /**
   * Get behavior statistics for a pet over time
   */
  async getPetBehaviorStats(petId: string, groupId: string, fromDate?: string, toDate?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('group_id', groupId);
    if (fromDate) {
      queryParams.append('from_date', fromDate);
    }
    if (toDate) {
      queryParams.append('to_date', toDate);
    }

    const url = `${this.baseUrl}/pets/${petId}/behavior-stats?${queryParams}`;
    return await apiService.get<any>(url);
  }

  /**
   * Validate a behavior log creation request
   */
  validateBehaviorLogRequest(request: CreateBehaviorLogRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.petId) {
      errors.push('Pet ID is required');
    }

    if (!request.behaviorId) {
      errors.push('Behavior ID is required');
    }

    if (!request.groupIds || request.groupIds.length === 0) {
      errors.push('At least one group must be specified');
    }

    if (request.notes && request.notes.length > 500) {
      errors.push('Notes cannot exceed 500 characters');
    }

    // Validate logged_at is not in the future
    if (request.loggedAt) {
      const loggedDate = new Date(request.loggedAt);
      const now = new Date();
      if (loggedDate > now) {
        errors.push('Cannot log behaviors in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a behavior can be logged (considering minimum intervals)
   */
  async canLogBehavior(petId: string, behaviorId: string): Promise<{ canLog: boolean; reason?: string; nextAllowedTime?: string }> {
    try {
      // This would be a custom endpoint to check duplicate prevention rules
      const url = `${this.baseUrl}/pets/${petId}/behaviors/${behaviorId}/can-log`;
      return await apiService.get<{ canLog: boolean; reason?: string; nextAllowedTime?: string }>(url);
    } catch (error) {
      // If endpoint doesn't exist, assume logging is allowed
      return { canLog: true };
    }
  }

  /**
   * Get recent behavior trends for insights
   */
  async getBehaviorTrends(groupId: string, days: number = 7): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days.toString());

    const url = `${this.baseUrl}/groups/${groupId}/behavior-trends?${queryParams}`;
    return await apiService.get<any>(url);
  }

  // Helper methods

  private formatDateForAPI(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private formatDateTimeForAPI(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString(); // Full ISO format
  }

  /**
   * Get today's date in the user's timezone as YYYY-MM-DD
   */
  getTodayDateString(): string {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  }

  /**
   * Get yesterday's date in the user's timezone as YYYY-MM-DD
   */
  getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('en-CA');
  }

  /**
   * Parse behavior log response and ensure proper date formats
   */
  private parseBehaviorLog(log: any): BehaviorLog {
    return {
      ...log,
      loggedAt: new Date(log.loggedAt).toISOString(),
      createdAt: new Date(log.createdAt).toISOString(),
    };
  }

  /**
   * Parse behavior logs array response
   */
  private parseBehaviorLogs(logs: any[]): BehaviorLog[] {
    return logs.map(log => this.parseBehaviorLog(log));
  }

  /**
   * Parse Pet of the Day response
   */
  private parsePetOfTheDay(winner: any): PetOfTheDayWinner {
    return {
      ...winner,
      date: new Date(winner.date).toISOString().split('T')[0], // Keep date as YYYY-MM-DD
      createdAt: new Date(winner.createdAt).toISOString(),
    };
  }

  /**
   * Handle API errors with behavior-specific context
   */
  private handleBehaviorError(error: any, context: string): never {
    if (error.message?.includes('duplicate')) {
      throw new Error(`This behavior was already logged recently. Please wait before logging again.`);
    }
    
    if (error.message?.includes('unauthorized')) {
      throw new Error(`You don't have permission to log behaviors for this pet or group.`);
    }
    
    if (error.message?.includes('not found')) {
      if (context.includes('behavior')) {
        throw new Error(`The selected behavior is no longer available.`);
      }
      if (context.includes('pet')) {
        throw new Error(`The selected pet was not found.`);
      }
      if (context.includes('group')) {
        throw new Error(`The selected group was not found.`);
      }
    }

    // Re-throw original error if no specific handling
    throw error;
  }
}

// Export singleton instance
export const behaviorService = new BehaviorService();
