import { Request, Response, NextFunction } from "express"
import { SlidingWindowExecutor } from "../redis/slidingWindowExecutor"
import { RateLimiter } from "../core/limiter"
import { RateLimitConfig } from "../types/config"

export function rateLimit(config: RateLimitConfig) {

  const executor = new SlidingWindowExecutor(config.redis)

  const scriptReady = executor.loadScript()

  const limiter = new RateLimiter(executor)

  const window = config.window
  const limit = config.limit
  const feature = config.feature

  const identifierFn =
    config.identifier || ((req: Request) => req.ip || "unknown_ip")

  return async function (req: Request, res: Response, next: NextFunction) {

    try {

      await scriptReady

      const identifier = identifierFn(req)

      const result = await limiter.check(
        identifier,
        feature,
        window,
        limit
      )

      if (!result.allowed) {

        return res.status(429).json({
          error: "Rate limit exceeded",
          resetTime: result.resetTime
        })

      }

      next()

    } catch (error) {

      next(error)

    }

  }
}