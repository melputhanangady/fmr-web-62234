// Rate limiting utilities for production security

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Configure rate limits for different actions
    this.configs.set('like', { maxRequests: 50, windowMs: 60000, blockDurationMs: 300000 }); // 50 likes per minute, 5min block
    this.configs.set('pass', { maxRequests: 100, windowMs: 60000, blockDurationMs: 300000 }); // 100 passes per minute, 5min block
    this.configs.set('message', { maxRequests: 30, windowMs: 60000, blockDurationMs: 300000 }); // 30 messages per minute, 5min block
    this.configs.set('profile_create', { maxRequests: 3, windowMs: 600000, blockDurationMs: 300000 }); // 3 creations per 10min, 5min block
    this.configs.set('profile_update', { maxRequests: 5, windowMs: 300000, blockDurationMs: 600000 }); // 5 updates per 5min, 10min block
    this.configs.set('photo_upload', { maxRequests: 10, windowMs: 300000, blockDurationMs: 600000 }); // 10 uploads per 5min, 10min block
    this.configs.set('login_attempt', { maxRequests: 5, windowMs: 300000, blockDurationMs: 1800000 }); // 5 attempts per 5min, 30min block
  }

  isAllowed(userId: string, action: string): { allowed: boolean; remainingRequests?: number; resetTime?: number } {
    const config = this.configs.get(action);
    if (!config) {
      return { allowed: true };
    }

    const key = `${userId}_${action}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    // Check if user is currently blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      return { 
        allowed: false, 
        resetTime: entry.blockedUntil 
      };
    }

    // If no entry exists, create one
    if (!entry) {
      this.limits.set(key, {
        count: 1,
        firstRequest: now
      });
      return { 
        allowed: true, 
        remainingRequests: config.maxRequests - 1 
      };
    }

    // Check if window has expired
    if (now - entry.firstRequest > config.windowMs) {
      // Reset the window
      this.limits.set(key, {
        count: 1,
        firstRequest: now
      });
      return { 
        allowed: true, 
        remainingRequests: config.maxRequests - 1 
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      // Block the user
      this.limits.set(key, {
        ...entry,
        blockedUntil: now + config.blockDurationMs
      });
      return { 
        allowed: false, 
        resetTime: now + config.blockDurationMs 
      };
    }

    // Increment count
    this.limits.set(key, {
      ...entry,
      count: entry.count + 1
    });

    return { 
      allowed: true, 
      remainingRequests: config.maxRequests - entry.count - 1 
    };
  }

  reset(userId: string, action?: string): void {
    if (action) {
      this.limits.delete(`${userId}_${action}`);
    } else {
      // Reset all actions for user
      for (const key of this.limits.keys()) {
        if (key.startsWith(`${userId}_`)) {
          this.limits.delete(key);
        }
      }
    }
  }

  getStatus(userId: string, action: string): { 
    allowed: boolean; 
    remainingRequests?: number; 
    resetTime?: number;
    blockedUntil?: number;
  } {
    const config = this.configs.get(action);
    if (!config) {
      return { allowed: true };
    }

    const key = `${userId}_${action}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      return { 
        allowed: true, 
        remainingRequests: config.maxRequests 
      };
    }

    // Check if user is blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return { 
        allowed: false, 
        resetTime: entry.blockedUntil,
        blockedUntil: entry.blockedUntil
      };
    }

    // Check if window has expired
    if (now - entry.firstRequest > config.windowMs) {
      return { 
        allowed: true, 
        remainingRequests: config.maxRequests 
      };
    }

    return { 
      allowed: entry.count < config.maxRequests, 
      remainingRequests: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.firstRequest + config.windowMs
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      const action = key.split('_').slice(1).join('_');
      const config = this.configs.get(action);
      
      if (config && 
          (!entry.blockedUntil || now > entry.blockedUntil) &&
          now - entry.firstRequest > config.windowMs) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Rate limiting hooks for React components
export const useRateLimit = (userId: string, action: string) => {
  const checkRateLimit = () => {
    return rateLimiter.isAllowed(userId, action);
  };

  const getStatus = () => {
    return rateLimiter.getStatus(userId, action);
  };

  const reset = () => {
    rateLimiter.reset(userId, action);
  };

  return {
    checkRateLimit,
    getStatus,
    reset
  };
};

// Rate limiting middleware for API calls
export const withRateLimit = async <T>(
  userId: string, 
  action: string, 
  apiCall: () => Promise<T>
): Promise<T> => {
  const { allowed, remainingRequests, resetTime } = rateLimiter.isAllowed(userId, action);
  
  if (!allowed) {
    const resetTimeFormatted = resetTime ? new Date(resetTime).toLocaleString() : 'Unknown';
    throw new Error(`Rate limit exceeded. Try again after ${resetTimeFormatted}`);
  }

  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    // Don't count failed requests against rate limit
    throw error;
  }
};

// Rate limiting decorator for functions
export const rateLimited = (action: string) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Extract userId from first argument (assuming it's always the first parameter)
      const userId = args[0];
      
      if (!userId) {
        throw new Error('User ID is required for rate limiting');
      }

      const { allowed, resetTime } = rateLimiter.isAllowed(userId, action);
      
      if (!allowed) {
        const resetTimeFormatted = resetTime ? new Date(resetTime).toLocaleString() : 'Unknown';
        throw new Error(`Rate limit exceeded for ${action}. Try again after ${resetTimeFormatted}`);
      }

      return method.apply(this, args);
    };
  };
};

export default rateLimiter;
