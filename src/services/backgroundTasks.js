import natural from 'natural';
import redis from '../config/redis.js';

export const extractHashtags = (content) => {
  const hashtags = content.match(/#(\w+)/g) || [];
  return hashtags.map(tag => tag.substring(1));
};

export const calculateSentiment = (content) => {
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(content);
  return analyzer.getSentiment(tokens);
};

export const processSubmission = async (platform, content, timestamp, analysisId, userId) => {
  console.log(`Processing submission ${analysisId} for user ${userId}`);
  
  const hashtags = extractHashtags(content);
  const sentimentScore = calculateSentiment(content);

  const submissionKey = `submission:${analysisId}`;
  const userSubmissionsKey = `user:${userId}:submissions`;
  const epochTime = new Date(timestamp).getTime() / 1000;

  try {
    // Store submission data
    await redis.hSet(submissionKey, {
      platform,
      content,
      timestamp,
      hashtags: hashtags.join(','),
      sentiment_score: sentimentScore.toString()
    });

    // Store submission ID in sorted set
    await redis.zAdd(userSubmissionsKey, {
      score: epochTime,
      value: analysisId
    });

    // Debug: Verify data was stored
    const storedData = await redis.hGetAll(submissionKey);
    const storedScore = await redis.zScore(userSubmissionsKey, analysisId);
    
    console.log('Stored submission data:', {
      submissionKey,
      data: storedData,
      score: storedScore
    });

    console.log(`Submission ${analysisId} from ${platform} processed and stored successfully.`);
  } catch (error) {
    console.error('Error storing submission:', error);
    throw error;
  }
}; 