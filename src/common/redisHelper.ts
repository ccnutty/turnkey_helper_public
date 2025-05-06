import Redis from 'ioredis';

import * as config from '../config'

// 创建一个 Redis 实例
const redis = new Redis({
  host: config.REDIS_HOST,
  port: parseInt(config.REDIS_PORT!),       
  password: config.REDIS_PASSWORD!, 
  db:parseInt(config.REDIS_DB!) 
});

console.log(`Redis connected to ${config.REDIS_HOST}:${config.REDIS_PORT},${config.REDIS_PASSWORD},${config.REDIS_DB}`);

export class RedisHelper {
    // 设置一个键值对
    static async setKeyValue(key: string, value: string) {
        await redis.set(key, value);
    }
    static async getValue(key: string) {
        const value = await redis.get(key);
        return value;
    }

    static async hget(key: string, field: string) {
        return redis.hget(key, field);
    }

    static async hset(key: string, field: string, value: string) {
        return redis.hset(key, field, value);
    }

    

}
 