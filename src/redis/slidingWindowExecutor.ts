import Redis from "ioredis"
import fs from "fs"
import path from "path"

export class SlidingWindowExecutor {
  private redis: Redis
  private scriptLoaded: boolean = false

  constructor(redis: Redis) {
    this.redis = redis
  }

  async loadScript() {
    if (this.scriptLoaded) return;
    
    let scriptPath = path.join(__dirname, "..", "scripts", "slidingWindow.lua");
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(__dirname, "scripts", "slidingWindow.lua");
    }
    const script = fs.readFileSync(scriptPath, "utf8")

    this.redis.defineCommand("slidingWindowExecutorCommand", {
      numberOfKeys: 1,
      lua: script
    });
    
    this.scriptLoaded = true
  }

  async execute(
    key: string,
    window: number,
    limit: number,
    currentTime: number,
    member: string
  ): Promise<number[]> {

    if (!this.scriptLoaded) {
      throw new Error("Lua script not loaded")
    }

    // @ts-ignore
    const result = await this.redis.slidingWindowExecutorCommand(
      key,
      window,
      limit,
      currentTime,
      member
    )

    return result as number[]
  }
}