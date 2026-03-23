// src/redis/slidingWindowExecutor.ts
import fs from "fs";
import path from "path";
var SlidingWindowExecutor = class {
  constructor(redis) {
    this.scriptLoaded = false;
    this.redis = redis;
  }
  async loadScript() {
    if (this.scriptLoaded) return;
    const scriptPath = path.join(__dirname, "..", "scripts", "slidingWindow.lua");
    const script = fs.readFileSync(scriptPath, "utf8");
    this.redis.defineCommand("slidingWindowExecutorCommand", {
      numberOfKeys: 1,
      lua: script
    });
    this.scriptLoaded = true;
  }
  async execute(key, window, limit, currentTime, member) {
    if (!this.scriptLoaded) {
      throw new Error("Lua script not loaded");
    }
    const result = await this.redis.slidingWindowExecutorCommand(
      key,
      window,
      limit,
      currentTime,
      member
    );
    return result;
  }
};

// src/core/limiter.ts
import { nanoid } from "nanoid";
var RateLimiter = class {
  constructor(executor) {
    this.executor = executor;
  }
  async check(identifier, feature, window, limit) {
    const key = `rate_limit:${identifier}:${feature}`;
    const currentTime = Date.now();
    const member = `${currentTime}-${nanoid()}`;
    const result = await this.executor.execute(
      key,
      window,
      limit,
      currentTime,
      member
    );
    return {
      allowed: result[0] === 1,
      count: result[1],
      resetTime: result[2]
    };
  }
};

// src/middleware/rateLimiter.ts
function rateLimit(config) {
  const executor = new SlidingWindowExecutor(config.redis);
  const scriptReady = executor.loadScript();
  const limiter = new RateLimiter(executor);
  const window = config.window;
  const limit = config.limit;
  const feature = config.feature;
  const identifierFn = config.identifier || ((req) => req.ip);
  return async function(req, res, next) {
    try {
      await scriptReady;
      const identifier = identifierFn(req);
      const result = await limiter.check(
        identifier,
        feature,
        window,
        limit
      );
      if (!result.allowed) {
        return res.status(429).json({
          error: "Rate limit exceeded",
          resetTime: result.resetTime
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
export {
  rateLimit
};
