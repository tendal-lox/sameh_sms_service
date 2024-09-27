import { BadGatewayException, InternalServerErrorException } from '@nestjs/common';
import Redis from 'ioredis'

export default class RedisService {
  redis

  constructor(redisPort, redisHost) {
    this.redis = new Redis({
      port: redisPort,
      host: redisHost,
    });
  }

  async connect(redisPort, redisHost) {
    this.redis = new Redis({
      port: redisPort,
      host: redisHost,
    });
  }

  async setex(key, expiry, value) {
    try {
      this.redis.setex(key, expiry, value);
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async set(key, value) {
    try {
      this.redis.set(key, value)
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async get(key) {
    try {
      return this.redis.get(key);
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
};