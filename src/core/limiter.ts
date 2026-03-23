import { nanoid } from "nanoid"
import { SlidingWindowExecutor } from "../redis/slidingWindowExecutor"

export class RateLimiter {

  private executor: SlidingWindowExecutor

  constructor(executor: SlidingWindowExecutor) {
    this.executor = executor
  }

  async check(
    identifier: string,
    feature: string,
    window: number,
    limit: number
  ) {

    const key = `rate_limit:${identifier}:${feature}`

    const currentTime = Date.now()

    const member = `${currentTime}-${nanoid()}`

    const result = await this.executor.execute(
      key,
      window,
      limit,
      currentTime,
      member
    )

    return {
      allowed: result[0] === 1,
      count: result[1],
      resetTime: result[2]
    }
  }
}