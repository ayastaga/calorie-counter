// lib/rate-limit.ts
import { LRUCache } from "lru-cache";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Define Duration type for Ratelimit
type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

// Types for configuration options
type LocalRateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

type RateLimitMode = "local" | "redis" | "hybrid";

type UnifiedRateLimitOptions = {
  mode?: RateLimitMode;
  local?: LocalRateLimitOptions;
  redis?: {
    requests?: number;
    window?: Duration;
    prefix?: string;
  };
};

// Default configurations
const DEFAULT_LOCAL_OPTIONS: Required<LocalRateLimitOptions> = {
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
};

const DEFAULT_REDIS_OPTIONS = {
  requests: 10,
  window: "10 s" as Duration,
  prefix: "uploader/ratelimit",
};

class UnifiedRateLimit {
  private localCache?: LRUCache<string, number[]>;
  private redisLimiter?: Ratelimit;
  private mode: RateLimitMode;

  constructor(options: UnifiedRateLimitOptions = {}) {
    this.mode =
      options.mode || (process.env.UPSTASH_REDIS_REST_URL ? "redis" : "local");

    // Initialize local cache if needed
    if (this.mode === "local" || this.mode === "hybrid") {
      const localOpts = { ...DEFAULT_LOCAL_OPTIONS, ...options.local };
      this.localCache = new LRUCache({
        max: localOpts.uniqueTokenPerInterval,
        ttl: localOpts.interval,
      });
    }

    // Initialize Redis limiter if needed
    if (this.mode === "redis" || this.mode === "hybrid") {
      try {
        const redisOpts = { ...DEFAULT_REDIS_OPTIONS, ...options.redis };
        this.redisLimiter = new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(
            redisOpts.requests,
            redisOpts.window
          ),
          analytics: true,
          prefix: redisOpts.prefix,
        });
      } catch (error) {
        console.warn(
          "Failed to initialize Redis rate limiter, falling back to local:",
          error
        );
        if (this.mode === "redis") {
          this.mode = "local";
          const localOpts = { ...DEFAULT_LOCAL_OPTIONS, ...options.local };
          this.localCache = new LRUCache({
            max: localOpts.uniqueTokenPerInterval,
            ttl: localOpts.interval,
          });
        }
      }
    }
  }

  private async checkLocal(
    limit: number,
    token: string
  ): Promise<{ success: boolean; remaining: number }> {
    return new Promise((resolve, reject) => {
      if (!this.localCache) {
        reject(new Error("Local cache not initialized"));
        return;
      }

      const tokenCount = this.localCache.get(token) || [0];
      if (tokenCount[0] === 0) {
        this.localCache.set(token, tokenCount);
      }
      tokenCount[0] += 1;

      const currentUsage = tokenCount[0] ?? 0; // Handle potential undefined
      const remaining = Math.max(0, limit - currentUsage);
      const success = currentUsage <= limit;

      resolve({ success, remaining });
    });
  }

  private async checkRedis(
    token: string
  ): Promise<{ success: boolean; remaining: number }> {
    if (!this.redisLimiter) {
      throw new Error("Redis limiter not initialized");
    }

    const result = await this.redisLimiter.limit(token);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  }

  async check(
    limit: number,
    token: string
  ): Promise<{ success: boolean; remaining: number; resetTime?: Date }> {
    try {
      switch (this.mode) {
        case "local":
          return await this.checkLocal(limit, token);

        case "redis":
          return await this.checkRedis(token);

        case "hybrid":
          // Try Redis first, fallback to local
          try {
            return await this.checkRedis(token);
          } catch (error) {
            console.warn(
              "Redis rate limit check failed, using local fallback:",
              error
            );
            return await this.checkLocal(limit, token);
          }

        default:
          throw new Error(`Unknown rate limit mode: ${this.mode}`);
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async checkLegacy(limit: number, token: string): Promise<void> {
    const result = await this.check(limit, token);
    if (!result.success) {
      throw new Error("Rate limit exceeded");
    }
  }

  // Utility method to get current mode
  getMode(): RateLimitMode {
    return this.mode;
  }

  // Method to get remaining quota without incrementing
  async getRemainingQuota(limit: number, token: string): Promise<number> {
    if (this.mode === "redis" && this.redisLimiter) {
      // For Redis, we need to check without incrementing (not directly supported)
      // This is an approximation
      try {
        const result = await this.redisLimiter.limit(token);
        return result.remaining + 1; // Add back the one we just consumed
      } catch (error) {
        console.warn("Failed to get Redis quota, falling back to local");
      }
    }

    // For local cache
    if (this.localCache) {
      const tokenCount = this.localCache.get(token) || [0];
      return Math.max(0, limit - tokenCount[0]);
    }

    return limit; // Default to full limit if unable to check
  }
}

// Factory function for backward compatibility with your original API
export default function rateLimit(options?: LocalRateLimitOptions) {
  const limiter = new UnifiedRateLimit({ mode: "local", local: options });

  return {
    check: (limit: number, token: string) => limiter.checkLegacy(limit, token),
  };
}

// Export the unified rate limiter class and pre-configured instances
export { UnifiedRateLimit };

// Pre-configured instances for common use cases
export const localRateLimit = new UnifiedRateLimit({ mode: "local" });
export const redisRateLimit = new UnifiedRateLimit({ mode: "redis" });
export const hybridRateLimit = new UnifiedRateLimit({ mode: "hybrid" });

// Specific instance for your calorie project with reCAPTCHA feedback
export const calorieProjectRateLimit = new UnifiedRateLimit({
  mode: "hybrid", // Try Redis first, fallback to local
  local: {
    uniqueTokenPerInterval: 1000, // Higher limit for registered users
    interval: 60000, // 1 minute
  },
  redis: {
    requests: 20, // More generous for authenticated requests
    window: "60 s" as Duration,
    prefix: "calorie-app/ratelimit",
  },
});

// reCAPTCHA-specific rate limiter (stricter for anonymous users)
export const recaptchaRateLimit = new UnifiedRateLimit({
  mode: "hybrid",
  local: {
    uniqueTokenPerInterval: 100,
    interval: 300000, // 5 minutes
  },
  redis: {
    requests: 5,
    window: "300 s" as Duration, // 5 minutes
    prefix: "calorie-app/recaptcha",
  },
});

// IP-based rate limiter for general API endpoints
export const ipRateLimit = new UnifiedRateLimit({
  mode: "hybrid",
  local: {
    uniqueTokenPerInterval: 500,
    interval: 60000, // 1 minute
  },
  redis: {
    requests: 100,
    window: "60 s" as Duration,
    prefix: "calorie-app/ip",
  },
});

// Utility function to create custom rate limiters
export function createRateLimit(options: UnifiedRateLimitOptions) {
  return new UnifiedRateLimit(options);
}
