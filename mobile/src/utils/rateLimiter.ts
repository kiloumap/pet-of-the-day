/**
 * Rate Limiting and Abuse Protection Utilities
 * Task T121: Implement rate limiting and abuse protection
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (...args: any[]) => string;
  onLimitReached?: (key: string) => void;
  skipOnSuccess?: boolean;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export interface RequestTracker {
  endpoint: string;
  method: string;
  timestamp: number;
  success: boolean;
  responseTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private requestHistory: RequestTracker[] = [];
  private readonly maxHistorySize = 1000;

  constructor(private defaultConfig: RateLimitConfig) {
    // Clean up expired entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  /**
   * Check if request is allowed under rate limit
   */
  async checkRateLimit(key: string, config?: Partial<RateLimitConfig>): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowKey = this.generateWindowKey(key, effectiveConfig);

    let entry = this.limits.get(windowKey);

    // Create new entry if doesn't exist or window expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + effectiveConfig.windowMs,
        firstRequest: now,
      };
      this.limits.set(windowKey, entry);
    }

    // Check if limit exceeded
    if (entry.count >= effectiveConfig.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      if (effectiveConfig.onLimitReached) {
        effectiveConfig.onLimitReached(key);
      }

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(windowKey, entry);

    return {
      allowed: true,
      remainingRequests: effectiveConfig.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Record request for monitoring
   */
  recordRequest(
    endpoint: string,
    method: string,
    success: boolean,
    responseTime: number
  ): void {
    const tracker: RequestTracker = {
      endpoint,
      method,
      timestamp: Date.now(),
      success,
      responseTime,
    };

    this.requestHistory.push(tracker);

    // Keep history size manageable
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get rate limit status for a key
   */
  getRateLimitStatus(key: string, config?: Partial<RateLimitConfig>): {
    count: number;
    remainingRequests: number;
    resetTime: number;
    isLimited: boolean;
  } | null {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const windowKey = this.generateWindowKey(key, effectiveConfig);
    const entry = this.limits.get(windowKey);

    if (!entry || Date.now() >= entry.resetTime) {
      return {
        count: 0,
        remainingRequests: effectiveConfig.maxRequests,
        resetTime: Date.now() + effectiveConfig.windowMs,
        isLimited: false,
      };
    }

    return {
      count: entry.count,
      remainingRequests: Math.max(0, effectiveConfig.maxRequests - entry.count),
      resetTime: entry.resetTime,
      isLimited: entry.count >= effectiveConfig.maxRequests,
    };
  }

  /**
   * Reset rate limit for a key
   */
  resetRateLimit(key: string, config?: Partial<RateLimitConfig>): void {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const windowKey = this.generateWindowKey(key, effectiveConfig);
    this.limits.delete(windowKey);
  }

  /**
   * Get abuse detection metrics
   */
  getAbuseMetrics(timeWindowMs: number = 60000): {
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsPerMinute: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    suspiciousPatterns: string[];
  } {
    const now = Date.now();
    const cutoffTime = now - timeWindowMs;

    const recentRequests = this.requestHistory.filter(
      req => req.timestamp >= cutoffTime
    );

    const totalRequests = recentRequests.length;
    const failedRequests = recentRequests.filter(req => !req.success).length;
    const averageResponseTime = totalRequests > 0
      ? recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / totalRequests
      : 0;
    const requestsPerMinute = (totalRequests / timeWindowMs) * 60000;

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    recentRequests.forEach(req => {
      const key = `${req.method} ${req.endpoint}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Detect suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(recentRequests);

    return {
      totalRequests,
      failedRequests,
      averageResponseTime,
      requestsPerMinute,
      topEndpoints,
      suspiciousPatterns,
    };
  }

  /**
   * Implement exponential backoff for retries
   */
  calculateBackoffDelay(attemptNumber: number, baseDelay: number = 1000): number {
    const maxDelay = 30000; // 30 seconds max
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter

    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
    this.requestHistory = [];
  }

  // Private methods

  private generateWindowKey(key: string, config: RateLimitConfig): string {
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
    return `${key}:${windowStart}`;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.limits.forEach((entry, key) => {
      if (now >= entry.resetTime) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.limits.delete(key));

    // Clean old request history
    const oneHourAgo = now - 3600000; // 1 hour
    this.requestHistory = this.requestHistory.filter(
      req => req.timestamp > oneHourAgo
    );
  }

  private detectSuspiciousPatterns(requests: RequestTracker[]): string[] {
    const patterns: string[] = [];

    if (requests.length === 0) return patterns;

    // High failure rate
    const failureRate = requests.filter(req => !req.success).length / requests.length;
    if (failureRate > 0.5) {
      patterns.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
    }

    // Rapid fire requests
    const rapidFireThreshold = 100; // ms
    let rapidFireCount = 0;
    for (let i = 1; i < requests.length; i++) {
      if (requests[i].timestamp - requests[i - 1].timestamp < rapidFireThreshold) {
        rapidFireCount++;
      }
    }
    if (rapidFireCount > requests.length * 0.3) {
      patterns.push('Rapid fire request pattern detected');
    }

    // Unusual response times
    const responseTimes = requests.map(req => req.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const slowRequests = responseTimes.filter(time => time > avgResponseTime * 3).length;
    if (slowRequests > requests.length * 0.2) {
      patterns.push('High number of slow requests');
    }

    // Endpoint scanning
    const uniqueEndpoints = new Set(requests.map(req => req.endpoint));
    if (uniqueEndpoints.size > requests.length * 0.8) {
      patterns.push('Potential endpoint scanning detected');
    }

    return patterns;
  }
}

// Rate limit configurations for different use cases
export const RATE_LIMIT_CONFIGS = {
  // General API calls
  API_GENERAL: {
    maxRequests: 60,
    windowMs: 60000, // 1 minute
  },

  // Authentication endpoints
  AUTH: {
    maxRequests: 5,
    windowMs: 300000, // 5 minutes
    onLimitReached: (key: string) => {
      console.warn(`Authentication rate limit reached for key: ${key}`);
    },
  },

  // File uploads
  UPLOAD: {
    maxRequests: 10,
    windowMs: 300000, // 5 minutes
  },

  // Search requests
  SEARCH: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
  },

  // Write operations (create, update, delete)
  WRITE_OPERATIONS: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
  },

  // Read operations
  READ_OPERATIONS: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
} as const;

// Create instances for different use cases
export const apiRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.API_GENERAL);
export const authRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.AUTH);
export const uploadRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.UPLOAD);

// Decorator for rate limiting functions
export function withRateLimit(config: RateLimitConfig, keyGenerator?: (...args: any[]) => string) {
  const limiter = new RateLimiter(config);

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator ? keyGenerator(...args) : `${target.constructor.name}.${propertyName}`;
      const rateLimitResult = await limiter.checkRateLimit(key);

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`
        );
      }

      const startTime = Date.now();
      let success = true;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const responseTime = Date.now() - startTime;
        limiter.recordRequest(propertyName, 'UNKNOWN', success, responseTime);
      }
    };

    return descriptor;
  };
}

// Throttle utility for UI interactions
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Debounce utility for search and input
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
}

// Request queue for managing concurrent requests
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running: number = 0;

  constructor(private concurrency: number = 3) {}

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const requestFn = this.queue.shift();

    if (requestFn) {
      try {
        await requestFn();
      } catch (error) {
        console.warn('Request queue error:', error);
      } finally {
        this.running--;
        this.process(); // Process next request
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

// Export default rate limiter
export default apiRateLimiter;