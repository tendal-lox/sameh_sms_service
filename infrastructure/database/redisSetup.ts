import { InternalServerErrorException } from '@nestjs/common';
import Redis from 'ioredis'

export default class RedisService {
  public redis: any

  constructor(redisPort: number | null, redisHost: string | null) {
    this.redis = new Redis({
      port: redisPort || 6379,
      host: redisHost || 'localhost',
    });
  }

  async setex(key: string, expiry: number, value: string) {
    try {
      this.redis.setex(key, expiry, value);
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async set(key: string, value: string) {
    try {
      this.redis.set(key, value);
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async get(key: string) {
    try {
      return this.redis.get(key);
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
};