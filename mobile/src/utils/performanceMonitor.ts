/**
 * Performance Monitoring and Optimization Utilities
 * Task T116: Optimize mobile app startup and navigation performance
 */

import { InteractionManager, Platform } from 'react-native';
import { FEATURES } from '../config/api';

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface NavigationMetrics {
  screenName: string;
  navigationTime: number;
  renderTime: number;
  totalTime: number;
  componentCount?: number;
  memoryUsage?: number;
}

export interface StartupMetrics {
  appLaunch: number;
  splashScreen: number;
  authCheck: number;
  initialData: number;
  navigationReady: number;
  firstScreen: number;
  total: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private navigationMetrics: NavigationMetrics[] = [];
  private startupMetrics: Partial<StartupMetrics> = {};
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = FEATURES.ENABLE_DEBUG_LOGGING || __DEV__;
  }

  // Performance timing utilities
  startTiming(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const startTime = this.getPerformanceNow();
    this.metrics.set(name, {
      name,
      startTime,
      metadata,
    });
  }

  endTiming(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance timer "${name}" not found`);
      return null;
    }

    const endTime = this.getPerformanceNow();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.metadata = { ...metric.metadata, ...additionalMetadata };

    this.logMetric(metric);
    return duration;
  }

  // Navigation performance tracking
  trackNavigation(screenName: string, startTime: number): void {
    if (!this.isEnabled) return;

    // Measure time until interactions are complete
    InteractionManager.runAfterInteractions(() => {
      const endTime = this.getPerformanceNow();
      const navigationTime = endTime - startTime;

      // Measure rendering time
      requestAnimationFrame(() => {
        const renderEndTime = this.getPerformanceNow();
        const renderTime = renderEndTime - endTime;
        const totalTime = renderEndTime - startTime;

        const navigationMetric: NavigationMetrics = {
          screenName,
          navigationTime,
          renderTime,
          totalTime,
          componentCount: this.estimateComponentCount(),
          memoryUsage: this.getMemoryUsage(),
        };

        this.navigationMetrics.push(navigationMetric);
        this.logNavigationMetric(navigationMetric);
      });
    });
  }

  // Startup performance tracking
  recordStartupMetric(phase: keyof StartupMetrics, time: number): void {
    if (!this.isEnabled) return;

    this.startupMetrics[phase] = time;

    // Calculate total when all phases are recorded
    if (this.startupMetrics.firstScreen && !this.startupMetrics.total) {
      this.startupMetrics.total = this.startupMetrics.firstScreen;
      this.logStartupMetrics();
    }
  }

  // Memory monitoring
  getMemoryUsage(): number {
    // This is a placeholder - in production, you might use a native module
    // or estimate based on component complexity
    if (Platform.OS === 'android') {
      // Android-specific memory monitoring could be implemented
      return 0;
    } else if (Platform.OS === 'ios') {
      // iOS-specific memory monitoring could be implemented
      return 0;
    }
    return 0;
  }

  // Component counting (estimation)
  private estimateComponentCount(): number {
    // This is an estimation - in practice, you might implement
    // a more sophisticated component counting mechanism
    return 0;
  }

  // Bundle size monitoring
  measureBundleLoadTime(): void {
    if (!this.isEnabled) return;

    const startTime = Date.now();

    // Measure when the JavaScript bundle is loaded
    InteractionManager.runAfterInteractions(() => {
      const loadTime = Date.now() - startTime;
      console.log('📦 Bundle load time:', loadTime, 'ms');
    });
  }

  // Performance reporting
  getMetrics(): {
    timing: PerformanceMetrics[];
    navigation: NavigationMetrics[];
    startup: Partial<StartupMetrics>;
  } {
    return {
      timing: Array.from(this.metrics.values()).filter(m => m.duration !== undefined),
      navigation: [...this.navigationMetrics],
      startup: { ...this.startupMetrics },
    };
  }

  // Performance analysis
  getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .filter(metric => metric.duration && metric.duration > threshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  getSlowNavigations(threshold: number = 500): NavigationMetrics[] {
    return this.navigationMetrics
      .filter(metric => metric.totalTime > threshold)
      .sort((a, b) => b.totalTime - a.totalTime);
  }

  // Reporting and analytics
  generatePerformanceReport(): {
    summary: {
      totalOperations: number;
      averageOperationTime: number;
      slowOperations: number;
      totalNavigations: number;
      averageNavigationTime: number;
      slowNavigations: number;
    };
    recommendations: string[];
  } {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined);

    const totalOperations = completedMetrics.length;
    const averageOperationTime = totalOperations > 0
      ? completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalOperations
      : 0;

    const slowOperations = this.getSlowOperations(1000).length;
    const slowNavigations = this.getSlowNavigations(500).length;

    const totalNavigations = this.navigationMetrics.length;
    const averageNavigationTime = totalNavigations > 0
      ? this.navigationMetrics.reduce((sum, m) => sum + m.totalTime, 0) / totalNavigations
      : 0;

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (averageNavigationTime > 300) {
      recommendations.push('Consider implementing navigation optimization or lazy loading');
    }

    if (slowOperations > 0) {
      recommendations.push(`${slowOperations} operations are slower than 1 second - consider optimization`);
    }

    if (this.startupMetrics.total && this.startupMetrics.total > 3000) {
      recommendations.push('App startup time is over 3 seconds - consider startup optimization');
    }

    if (slowNavigations > totalNavigations * 0.2) {
      recommendations.push('More than 20% of navigations are slow - consider screen optimization');
    }

    return {
      summary: {
        totalOperations,
        averageOperationTime,
        slowOperations,
        totalNavigations,
        averageNavigationTime,
        slowNavigations,
      },
      recommendations,
    };
  }

  // Utilities
  private getPerformanceNow(): number {
    return Date.now(); // In production, might use performance.now() if available
  }

  private logMetric(metric: PerformanceMetrics): void {
    if (!this.isEnabled || !metric.duration) return;

    const emoji = metric.duration > 1000 ? '🐌' : metric.duration > 500 ? '⚠️' : '✅';
    console.log(
      `${emoji} Performance: ${metric.name} took ${metric.duration.toFixed(2)}ms`,
      metric.metadata
    );
  }

  private logNavigationMetric(metric: NavigationMetrics): void {
    if (!this.isEnabled) return;

    const emoji = metric.totalTime > 500 ? '🐌' : metric.totalTime > 200 ? '⚠️' : '🚀';
    console.log(
      `${emoji} Navigation: ${metric.screenName} - Total: ${metric.totalTime.toFixed(2)}ms ` +
      `(Nav: ${metric.navigationTime.toFixed(2)}ms, Render: ${metric.renderTime.toFixed(2)}ms)`
    );
  }

  private logStartupMetrics(): void {
    if (!this.isEnabled || !this.startupMetrics.total) return;

    console.log('🚀 Startup Performance:', {
      appLaunch: this.startupMetrics.appLaunch,
      splashScreen: this.startupMetrics.splashScreen,
      authCheck: this.startupMetrics.authCheck,
      initialData: this.startupMetrics.initialData,
      navigationReady: this.startupMetrics.navigationReady,
      firstScreen: this.startupMetrics.firstScreen,
      total: this.startupMetrics.total,
    });
  }

  // Cleanup
  clear(): void {
    this.metrics.clear();
    this.navigationMetrics = [];
    this.startupMetrics = {};
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance HOCs and utilities
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    performanceMonitor.startTiming(name);

    try {
      const result = fn(...args);

      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          performanceMonitor.endTiming(name);
        });
      } else {
        performanceMonitor.endTiming(name);
        return result;
      }
    } catch (error) {
      performanceMonitor.endTiming(name, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }) as T;
}

// Screen performance HOC
export function withScreenPerformanceTracking(WrappedComponent: React.ComponentType, screenName: string) {
  return function PerformanceTrackedScreen(props: any) {
    const navigationStartTime = performanceMonitor.getPerformanceNow();

    React.useEffect(() => {
      performanceMonitor.trackNavigation(screenName, navigationStartTime);
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}

// Startup performance tracking utilities
export const StartupTracker = {
  markAppLaunch: () => {
    performanceMonitor.recordStartupMetric('appLaunch', Date.now());
  },

  markSplashScreenEnd: () => {
    performanceMonitor.recordStartupMetric('splashScreen', Date.now());
  },

  markAuthCheckComplete: () => {
    performanceMonitor.recordStartupMetric('authCheck', Date.now());
  },

  markInitialDataLoaded: () => {
    performanceMonitor.recordStartupMetric('initialData', Date.now());
  },

  markNavigationReady: () => {
    performanceMonitor.recordStartupMetric('navigationReady', Date.now());
  },

  markFirstScreenReady: () => {
    performanceMonitor.recordStartupMetric('firstScreen', Date.now());
  },
};

// Performance optimization utilities
export const PerformanceUtils = {
  // Debounce utility for performance-sensitive operations
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  },

  // Throttle utility for limiting function calls
  throttle: <T extends (...args: any[]) => any>(fn: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Batch operations to reduce re-renders
  batchUpdates: (operations: (() => void)[]): void => {
    // In React Native, batching is handled automatically in most cases
    // This utility could be enhanced with unstable_batchedUpdates if needed
    operations.forEach(op => op());
  },

  // Measure component render time
  measureRender: (componentName: string, renderFn: () => React.ReactElement): React.ReactElement => {
    const startTime = Date.now();
    const result = renderFn();
    const endTime = Date.now();

    if (__DEV__) {
      console.log(`🎨 Render: ${componentName} took ${endTime - startTime}ms`);
    }

    return result;
  },
};

export default performanceMonitor;