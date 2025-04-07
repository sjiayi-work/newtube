import { Redis } from '@upstash/redis';

// NT-7: Setup Upstash Redis

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});