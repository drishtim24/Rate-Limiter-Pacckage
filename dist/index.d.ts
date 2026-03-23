import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimitConfig {
    redis: Redis;
    window: number;
    limit: number;
    feature: string;
    identifier?: (req: Request) => string;
}

declare function rateLimit(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;

export { rateLimit };
