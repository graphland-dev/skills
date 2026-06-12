import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private logger = new Logger(RedisService.name);
  public redis: Redis;
  public redisNamespace = 'app';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);

    this.redis.on('connect', () => {
      this.logger.debug('Connected to Redis');
    });
    this.redis.on('error', (err) => {
      this.logger.error(err);
    });

    this.redis.on('reconnecting', () => {
      this.logger.debug('Reconnecting to Redis');
    });

    this.redis.on('close', () => {
      this.logger.debug('Disconnected from Redis');
    });
  }

  /**
   * Remember a value in the cache
   * @param key - The key to store the value in the cache
   * @param callback - The callback to execute to get the value
   * @param ttl - The time to live in milliseconds
   * @returns
   */
  async rememberCallback(
    key: string,
    callback: () => any,
    ttl: number = 60 * 1000 * 60 * 24,
  ) {
    const cachedData = await this.redis.get(`${this.redisNamespace}:${key}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await callback();
    await this.setValue(key, data, ttl);
    return data;
  }

  /**
   * Forget a key from the cache
   * @param key - The key to forget
   * @returns
   */
  async forget(key: string) {
    const keys = await this.redis.keys(`${this.redisNamespace}:${key}`);

    if (!keys.length) {
      return this.logger.log(`Key ${key} not found in cache`);
    }
    return this.redis.del(keys, (err, count) => {
      if (err) {
        this.logger.error(err);
      }
      this.logger.log(`Deleted cache key ${key} with count ${count}`);
    });
  }

  /**
   * Store a value in the cache
   * @param key - The key to store the value in the cache
   * @param value - The value to store in the cache
   * @param ttl - The time to live in milliseconds
   * @returns
   */
  setValue(key: string, value: any, ttl: number = 60 * 1000) {
    return this.redis.set(
      `${this.redisNamespace}:${key}`,
      JSON.stringify(value),
      'PX',
      ttl,
      (err, result) => {
        if (err) {
          this.logger.error(err);
        }
        this.logger.log(
          `Set cache key ${this.redisNamespace}:${key} with result ${result}`,
        );
      },
    );
  }

  /**
   * Get a value from the cache
   * @param key - The key to get the value from the cache
   * @returns
   */
  async getValue(key: string) {
    const value = await this.redis.get(`${this.redisNamespace}:${key}`);
    return JSON.parse(value);
  }

  /**
   * Forget all keys from the cache
   * @returns
   * @todo - This is not working
   */
  flush() {
    return this.redis.flushall();
  }
}
