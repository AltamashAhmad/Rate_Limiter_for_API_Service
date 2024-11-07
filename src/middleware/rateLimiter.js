import redis from '../config/redis.js';

const RATE_LIMITS = {
  free: {
    per_minute: parseInt(process.env.FREE_RATE_PER_MINUTE) || 10,
    per_hour: parseInt(process.env.FREE_RATE_PER_HOUR) || 100
  },
  standard: {
    per_minute: parseInt(process.env.STANDARD_RATE_PER_MINUTE) || 50,
    per_hour: parseInt(process.env.STANDARD_RATE_PER_HOUR) || 500
  },
  premium: {
    per_minute: parseInt(process.env.PREMIUM_RATE_PER_MINUTE) || 200,
    per_hour: parseInt(process.env.PREMIUM_RATE_PER_HOUR) || 2000
  }
};

export const isRateLimited = async (userId, tier) => {
  const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const minuteKey = `rate_limit:${userId}:${tier}:minute`;
  const hourKey = `rate_limit:${userId}:${tier}:hour`;

  const minuteCount = await redis.incr(minuteKey);
  const hourCount = await redis.incr(hourKey);

  if (minuteCount === 1) await redis.expire(minuteKey, 60);
  if (hourCount === 1) await redis.expire(hourKey, 3600);

  if (minuteCount > limits.per_minute || hourCount > limits.per_hour) {
    const retryInSeconds = await redis.ttl(minuteKey);
    return [true, retryInSeconds];
  }
  return [false, null];
};

export default RATE_LIMITS; 