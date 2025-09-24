/**
 * Cache Manager for API Response Caching
 * Task T115: Implement API response caching strategies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface CacheConfig {
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  enableCompression?: boolean;
  keyPrefix?: string;
}

export class CacheManager {
  private config: Required<CacheConfig>;
  private memoryCache: Map<string, CacheEntry<any>>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB
      enableCompression: config.enableCompression || false,
      keyPrefix: config.keyPrefix || 'petoftheday_cache_',
    };

    this.memoryCache = new Map();

    // Clean up expired entries periodically
    this.startCleanupTimer();
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check persistent storage
    try {
      const stored = await AsyncStorage.getItem(fullKey);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);

      if (this.isExpired(entry)) {
        // Clean up expired entry
        await this.remove(key);
        return null;
      }

      // Store in memory cache for faster access
      this.memoryCache.set(fullKey, entry);
      return entry.data;

    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      key: fullKey,
    };

    try {
      // Store in memory cache
      this.memoryCache.set(fullKey, entry);

      // Store in persistent storage
      const serialized = JSON.stringify(entry);

      // Check size constraints
      if (serialized.length > this.config.maxSize / 100) {
        console.warn('Cache entry too large, skipping persistent storage');
        return;
      }

      await AsyncStorage.setItem(fullKey, serialized);

    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Remove cached data
   */
  async remove(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      this.memoryCache.delete(fullKey);
      await AsyncStorage.removeItem(fullKey);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();

      // Get all keys with our prefix
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(this.config.keyPrefix));

      if (ourKeys.length > 0) {
        await AsyncStorage.multiRemove(ourKeys);
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    persistentEntries: number;
    totalSize: number;
    expiredEntries: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(this.config.keyPrefix));

      let totalSize = 0;
      let expiredEntries = 0;

      for (const key of ourKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          totalSize += stored.length;

          try {
            const entry: CacheEntry<any> = JSON.parse(stored);
            if (this.isExpired(entry)) {
              expiredEntries++;
            }
          } catch {
            // Invalid entry, count as expired
            expiredEntries++;
          }
        }
      }

      return {
        memoryEntries: this.memoryCache.size,
        persistentEntries: ourKeys.length,
        totalSize,
        expiredEntries,
      };

    } catch (error) {
      console.warn('Cache stats error:', error);
      return {
        memoryEntries: this.memoryCache.size,
        persistentEntries: 0,
        totalSize: 0,
        expiredEntries: 0,
      };
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;

    try {
      // Clean memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }

      // Clean persistent storage
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => key.startsWith(this.config.keyPrefix));

      const expiredKeys: string[] = [];

      for (const key of ourKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          try {
            const entry: CacheEntry<any> = JSON.parse(stored);
            if (this.isExpired(entry)) {
              expiredKeys.push(key);
            }
          } catch {
            // Invalid entry, remove it
            expiredKeys.push(key);
          }
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        cleaned += expiredKeys.length;
      }

    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }

    return cleaned;
  }

  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private startCleanupTimer(): void {
    // Clean up every 10 minutes
    setInterval(() => {
      this.cleanup().then(cleaned => {
        if (cleaned > 0) {
          console.log(`Cache cleanup: removed ${cleaned} expired entries`);
        }
      });
    }, 10 * 60 * 1000);
  }
}

// Cache key constants
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  PETS_LIST: 'pets_list',
  PET_DETAIL: (id: string) => `pet_detail_${id}`,
  PET_PERSONALITY: (id: string) => `pet_personality_${id}`,
  PET_NOTEBOOKS: (id: string) => `pet_notebooks_${id}`,
  NOTEBOOK_ENTRIES: (petId: string, notebookId: string) => `notebook_entries_${petId}_${notebookId}`,
  SHARED_NOTEBOOKS: 'shared_notebooks',
  PENDING_INVITES: 'pending_invites',
  BEHAVIORS: 'behaviors',
  GROUP_LEADERBOARD: (id: string) => `group_leaderboard_${id}`,
} as const;

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 2 * 60 * 60 * 1000, // 2 hours
} as const;

// Default cache manager instance
export const cacheManager = new CacheManager({
  defaultTTL: CACHE_TTL.MEDIUM,
  maxSize: 10 * 1024 * 1024, // 10MB
  keyPrefix: 'petoftheday_',
});

/**
 * Cached API wrapper
 * Automatically handles caching for API calls
 */
export class CachedApiWrapper {
  constructor(private cache: CacheManager = cacheManager) {}

  async getCached<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Call API and cache result
    const result = await apiCall();
    await this.cache.set(key, result, ttl);

    return result;
  }

  async invalidateCache(key: string): Promise<void> {
    await this.cache.remove(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // This would require more complex implementation
    // For now, just clear all cache
    if (pattern === '*') {
      await this.cache.clear();
    }
  }
}

export const cachedApi = new CachedApiWrapper();

// Cache-aware service decorators
export function withCache<T extends (...args: any[]) => Promise<any>>(
  cacheKey: string | ((...args: Parameters<T>) => string),
  ttl: number = CACHE_TTL.MEDIUM
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = typeof cacheKey === 'function' ? cacheKey(...args) : cacheKey;

      return cachedApi.getCached(key, () => method.apply(this, args), ttl);
    };

    return descriptor;
  };
}

// Example usage patterns:
//
// Basic caching:
// const pets = await cachedApi.getCached(
//   CACHE_KEYS.PETS_LIST,
//   () => apiService.getPets(),
//   CACHE_TTL.MEDIUM
// );
//
// Using decorator:
// class PetsService {
//   @withCache(CACHE_KEYS.PETS_LIST, CACHE_TTL.MEDIUM)
//   async getAllPets(): Promise<Pet[]> {
//     return this.apiService.getPets();
//   }
// }
//
// Manual cache management:
// await cacheManager.set(CACHE_KEYS.PET_DETAIL('123'), petData, CACHE_TTL.LONG);
// const pet = await cacheManager.get(CACHE_KEYS.PET_DETAIL('123'));
// await cacheManager.remove(CACHE_KEYS.PET_DETAIL('123'));