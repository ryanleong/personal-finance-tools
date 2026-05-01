/**
 * Rate Limiter Utility
 * Implements token bucket algorithm for rate limiting
 * Prevents abuse of server actions
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private readonly windowMs: number;

  constructor(maxRequests: number, windowSeconds: number) {
    this.maxTokens = maxRequests;
    this.refillRate = maxRequests / windowSeconds;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Usually IP address or user ID
   * @returns true if request is allowed, false if rate limit exceeded
   */
  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry) {
      // First request from this identifier
      this.requests.set(identifier, {
        tokens: this.maxTokens - 1,
        lastRefill: now,
      });
      return true;
    }

    // Calculate tokens to add based on time passed
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;
    const newTokens = Math.min(this.maxTokens, entry.tokens + tokensToAdd);

    if (newTokens >= 1) {
      // Allow the request and consume a token
      this.requests.set(identifier, {
        tokens: newTokens - 1,
        lastRefill: now,
      });
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get time until next token is available (in seconds)
   */
  public getRetryAfter(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry) return 0;

    const tokensNeeded = 1 - entry.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  /**
   * Clean up old entries to prevent memory leak
   * Should be called periodically
   */
  public cleanup(): void {
    const now = Date.now();
    const expiredTime = now - this.windowMs * 2;

    for (const [key, entry] of this.requests.entries()) {
      if (entry.lastRefill < expiredTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create rate limiters for different endpoints
// File upload: 10 requests per minute
export const uploadRateLimiter = new RateLimiter(10, 60);

// File processing: 5 requests per minute (more intensive)
export const processRateLimiter = new RateLimiter(5, 60);

// Cleanup old entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    uploadRateLimiter.cleanup();
    processRateLimiter.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Get client IP address from headers
 */
export function getClientIP(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to a default identifier
  return 'unknown';
}
