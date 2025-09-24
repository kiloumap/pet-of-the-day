package ratelimit

import (
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/errors"
)

// RateLimitConfig defines configuration for rate limiting
type RateLimitConfig struct {
	RequestsPerMinute int           // Number of requests allowed per minute
	BurstSize         int           // Number of requests allowed in a burst
	WindowSize        time.Duration // Time window for rate limiting
	CleanupInterval   time.Duration // How often to clean up expired entries
}

// DefaultRateLimitConfig returns a default rate limiting configuration
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		RequestsPerMinute: 60,           // 60 requests per minute
		BurstSize:         10,           // Allow bursts of 10 requests
		WindowSize:        time.Minute,  // 1-minute window
		CleanupInterval:   5 * time.Minute, // Cleanup every 5 minutes
	}
}

// StrictRateLimitConfig returns a stricter rate limiting configuration
func StrictRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		RequestsPerMinute: 30,           // 30 requests per minute
		BurstSize:         5,            // Allow bursts of 5 requests
		WindowSize:        time.Minute,  // 1-minute window
		CleanupInterval:   5 * time.Minute, // Cleanup every 5 minutes
	}
}

// TokenBucket implements a token bucket rate limiter
type TokenBucket struct {
	tokens     float64
	maxTokens  float64
	refillRate float64
	lastRefill time.Time
	mutex      sync.Mutex
}

// NewTokenBucket creates a new token bucket
func NewTokenBucket(maxTokens, refillRate float64) *TokenBucket {
	return &TokenBucket{
		tokens:     maxTokens,
		maxTokens:  maxTokens,
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

// TryConsume attempts to consume a token from the bucket
func (tb *TokenBucket) TryConsume() bool {
	tb.mutex.Lock()
	defer tb.mutex.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastRefill).Seconds()

	// Refill tokens based on elapsed time
	tb.tokens += elapsed * tb.refillRate
	if tb.tokens > tb.maxTokens {
		tb.tokens = tb.maxTokens
	}
	tb.lastRefill = now

	// Try to consume a token
	if tb.tokens >= 1.0 {
		tb.tokens--
		return true
	}

	return false
}

// RateLimiter manages rate limiting for multiple clients
type RateLimiter struct {
	config  RateLimitConfig
	buckets map[string]*TokenBucket
	mutex   sync.RWMutex
	cleanup *time.Ticker
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(config RateLimitConfig) *RateLimiter {
	rl := &RateLimiter{
		config:  config,
		buckets: make(map[string]*TokenBucket),
		cleanup: time.NewTicker(config.CleanupInterval),
	}

	// Start cleanup goroutine
	go rl.cleanupExpiredBuckets()

	return rl
}

// getBucket gets or creates a token bucket for a client identifier
func (rl *RateLimiter) getBucket(identifier string) *TokenBucket {
	rl.mutex.RLock()
	bucket, exists := rl.buckets[identifier]
	rl.mutex.RUnlock()

	if exists {
		return bucket
	}

	// Create new bucket
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	// Double-check after acquiring write lock
	if bucket, exists := rl.buckets[identifier]; exists {
		return bucket
	}

	// Create new bucket with configured parameters
	refillRate := float64(rl.config.RequestsPerMinute) / 60.0 // tokens per second
	bucket = NewTokenBucket(float64(rl.config.BurstSize), refillRate)
	rl.buckets[identifier] = bucket
	return bucket
}

// IsAllowed checks if a request should be allowed for the given identifier
func (rl *RateLimiter) IsAllowed(identifier string) bool {
	bucket := rl.getBucket(identifier)
	return bucket.TryConsume()
}

// cleanupExpiredBuckets removes buckets that haven't been used recently
func (rl *RateLimiter) cleanupExpiredBuckets() {
	for {
		select {
		case <-rl.cleanup.C:
			rl.mutex.Lock()
			cutoff := time.Now().Add(-2 * rl.config.WindowSize)

			for identifier, bucket := range rl.buckets {
				bucket.mutex.Lock()
				if bucket.lastRefill.Before(cutoff) {
					delete(rl.buckets, identifier)
				}
				bucket.mutex.Unlock()
			}
			rl.mutex.Unlock()
		}
	}
}

// Stop stops the rate limiter cleanup goroutine
func (rl *RateLimiter) Stop() {
	rl.cleanup.Stop()
}

// IPBasedRateLimitMiddleware creates middleware that limits requests based on IP address
func IPBasedRateLimitMiddleware(rateLimiter *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get client IP address
			clientIP := getClientIP(r)

			if !rateLimiter.IsAllowed(clientIP) {
				w.Header().Set("Retry-After", strconv.Itoa(60))
				errors.WriteErrorResponse(w, errors.ErrCodeRateLimited,
					"Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// UserBasedRateLimitMiddleware creates middleware that limits requests based on authenticated user
func UserBasedRateLimitMiddleware(rateLimiter *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Try to get user ID from context
			userID, err := auth.GetUserIDFromContext(r.Context())
			var identifier string

			if err != nil {
				// Fall back to IP-based rate limiting for unauthenticated requests
				identifier = "ip:" + getClientIP(r)
			} else {
				// Use user ID for authenticated requests
				identifier = "user:" + userID.String()
			}

			if !rateLimiter.IsAllowed(identifier) {
				w.Header().Set("Retry-After", strconv.Itoa(60))
				errors.WriteErrorResponse(w, errors.ErrCodeRateLimited,
					"Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// EndpointSpecificRateLimitMiddleware creates middleware for specific endpoint rate limiting
func EndpointSpecificRateLimitMiddleware(rateLimiter *RateLimiter, endpointName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create identifier combining user/IP with endpoint
			var baseIdentifier string
			userID, err := auth.GetUserIDFromContext(r.Context())

			if err != nil {
				baseIdentifier = "ip:" + getClientIP(r)
			} else {
				baseIdentifier = "user:" + userID.String()
			}

			identifier := baseIdentifier + ":endpoint:" + endpointName

			if !rateLimiter.IsAllowed(identifier) {
				w.Header().Set("Retry-After", strconv.Itoa(60))
				errors.WriteErrorResponse(w, errors.ErrCodeRateLimited,
					"Rate limit exceeded for this endpoint. Please try again later.", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// getClientIP extracts the client IP address from the request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (proxy/load balancer)
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, use the first one
		if idx := strings.Index(forwarded, ","); idx != -1 {
			return strings.TrimSpace(forwarded[:idx])
		}
		return strings.TrimSpace(forwarded)
	}

	// Check X-Real-IP header (nginx proxy)
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return strings.TrimSpace(realIP)
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}