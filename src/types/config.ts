import Redis from "ioredis";
import { Request } from "express";

export interface RateLimitConfig {
  redis: Redis;
  window: number;
  limit: number;
  feature: string;
  identifier?: (req: Request) => string;
}
