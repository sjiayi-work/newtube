import { Ratelimit } from '@upstash/ratelimit';

import { redis } from './redis';

/**
 * NT-7: Setup Upstash Ratelimit.
 * For more details, @see {@link https://upstash.com/docs/redis/sdks/ratelimit-ts/traffic-protection#traffic-protection}
 */ 

export const ratelimit = new Ratelimit({
    redis, 
    limiter: Ratelimit.slidingWindow(10, '10s')
});