import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BillingErrorCode } from './billing.contracts';
import { BillingEntitlementException } from './billing.exceptions';

/** Fixed-window per-org rate limiter (Redis INCR + EXPIRE). */
@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(
      this.configService.get<string>('redis.url', 'redis://localhost:6379'),
      { maxRetriesPerRequest: 1, enableReadyCheck: false },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch((error) => {
      this.logger.warn(`Failed to close rate-limit Redis client: ${String(error)}`);
    });
  }

  async assertRateLimit(
    organizationId: string,
    maxPerMinute: number,
  ): Promise<void> {
    if (maxPerMinute <= 0) {
      return;
    }

    const key = `rate:${organizationId}`;
    const windowSeconds = 60;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    if (count > maxPerMinute) {
      const ttl = await this.redis.ttl(key);
      throw new BillingEntitlementException(
        429,
        BillingErrorCode.RATE_LIMIT_EXCEEDED,
        'Organization rate limit exceeded',
        { retryAfterSeconds: Math.max(ttl, 1) },
      );
    }
  }
}
