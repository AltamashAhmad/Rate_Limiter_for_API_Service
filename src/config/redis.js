import { createClient } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', err => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('Redis Connected Successfully'));

// Connect to Redis
try {
  await redisClient.connect();
} catch (err) {
  logger.error('Redis Connection Error:', err);
  process.exit(1);
}

export default redisClient; 