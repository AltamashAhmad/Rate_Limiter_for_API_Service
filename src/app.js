import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import redis from './config/redis.js';
import { isRateLimited } from './middleware/rateLimiter.js';
import { processSubmission } from './services/backgroundTasks.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

app.use(cors());
app.use(express.json());

// Submit endpoint
app.post('/api/v1/analytics/submit', async (req, res) => {
  try {
    const { platform, content } = req.body;
    const userId = req.header('X-User-ID');
    const tier = req.header('X-User-Tier') || 'free';
    const timestamp = new Date().toISOString();

    if (!userId || !platform || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    logger.info('Received submission:', { userId, tier, platform });

    const [isLimited, retryAfter] = await isRateLimited(userId, tier);
    if (isLimited) {
      logger.info('Rate limit exceeded for user:', { userId, tier, retryAfter });
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        status: 'error',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      });
    }

    const submissionId = crypto.randomUUID();
    await processSubmission(platform, content, timestamp, submissionId, userId);

    logger.info('Submission stored successfully:', { submissionId });
    return res.status(200).json({ 
      status: 'success', 
      submissionId 
    });

  } catch (error) {
    logger.error('Submit endpoint error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error' 
    });
  }
});

// Dashboard endpoint
app.get('/api/v1/analytics/dashboard', async (req, res) => {
  try {
    const { user_id, platform } = req.query;

    if (!user_id) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing user_id parameter.' 
      });
    }

    const userSubmissionsKey = `user:${user_id}:submissions`;
    
    // Debug: Check all keys in Redis
    const allKeys = await redis.keys('*');
    logger.debug('All Redis keys:', allKeys);

    // Get all submissions
    const submissions = await redis.zRange(userSubmissionsKey, 0, -1);
    logger.debug(`Found ${submissions.length} submissions for key ${userSubmissionsKey}`);

    const hashtagsMap = new Map();
    let totalSentiment = 0;
    let validSubmissions = 0;

    // Process each submission
    for (const submissionId of submissions) {
      const submissionKey = `submission:${submissionId}`;
      const submission = await redis.hGetAll(submissionKey);
      
      logger.debug(`Submission data for ${submissionId}:`, submission);

      // Skip if platform filter is applied and doesn't match
      if (platform && submission.platform !== platform) {
        continue;
      }

      validSubmissions++;

      // Process hashtags
      if (submission.hashtags) {
        const tags = submission.hashtags.split(',');
        for (const tag of tags) {
          if (tag) {
            hashtagsMap.set(tag, (hashtagsMap.get(tag) || 0) + 1);
          }
        }
      }

      // Add sentiment score
      if (submission.sentiment_score) {
        totalSentiment += parseFloat(submission.sentiment_score);
      }
    }

    // Sort hashtags by frequency
    const sortedHashtags = Array.from(hashtagsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)  // Get top 10 hashtags
      .map(([tag]) => tag);

    const response = {
      mentions_count: validSubmissions,
      top_hashtags: sortedHashtags,
      sentiment_score: validSubmissions > 0 ? totalSentiment / validSubmissions : 0
    };

    logger.debug('Dashboard response:', response);
    return res.status(200).json(response);

  } catch (error) {
    logger.error('Dashboard endpoint error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    return res.status(200).json({ 
      status: 'success', 
      message: 'Service is healthy',
      redis: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Service unhealthy',
      redis: 'disconnected'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing HTTP server and Redis connection');
  await redis.quit();
  process.exit(0);
}); 