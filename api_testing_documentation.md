# API Testing Documentation

## Prerequisites
- Node.js and npm installed
- Redis server running
- cURL or Postman for testing
- Apache Bench (optional, for load testing)

## Setup
1. Start Redis server:
```bash
brew services start redis
```

2. Start the application:
```bash
npm start
````

## API Endpoints Testing

### 1. Health Check
```bash
curl http://localhost:3000/health
```
**Expected Response:**
```json
{
  "status": "success",
  "message": "Service is healthy",
  "redis": "connected"
}
```

### 2. Submit Analytics Data

#### a. Basic Submit (Free Tier)
```bash
curl -X POST http://localhost:3000/api/v1/analytics/submit \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test123" \
  -H "X-User-Tier: free" \
  -d '{
    "platform": "twitter",
    "content": "Testing the API #test #nodejs",
    "timestamp": "2024-02-06T12:00:00Z"
  }'
```
**Expected Response:**
```json
{
  "status": "success",
  "submission_id": "<uuid>"
}
```

#### b. Sentiment Analysis Testing
```bash
# Test positive sentiment
curl -X POST http://localhost:3000/api/v1/analytics/submit \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test123" \
  -H "X-User-Tier: free" \
  -d '{
    "platform": "twitter",
    "content": "I absolutely love this amazing feature! #happy",
    "timestamp": "2024-02-06T12:00:00Z"
  }'

# Test negative sentiment
curl -X POST http://localhost:3000/api/v1/analytics/submit \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test123" \
  -H "X-User-Tier: free" \
  -d '{
    "platform": "twitter",
    "content": "This is terrible and frustrating! #angry",
    "timestamp": "2024-02-06T12:00:00Z"
  }'
```

### 3. Dashboard Analytics

#### a. Basic Dashboard Query
```bash
curl "http://localhost:3000/api/v1/analytics/dashboard?user_id=test123"
```

#### b. Time-Filtered Dashboard
```bash
# Current time as start time
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
curl "http://localhost:3000/api/v1/analytics/dashboard?user_id=test123&start_date=$START_TIME"

# Time range query
curl "http://localhost:3000/api/v1/analytics/dashboard?user_id=test123&start_date=2024-02-06T00:00:00Z&end_date=2024-02-06T23:59:59Z"
```

#### c. Platform-Specific Dashboard
```bash
curl "http://localhost:3000/api/v1/analytics/dashboard?user_id=test123&platform=twitter"
```

### 4. Rate Limit Testing

#### a. Free Tier Limits (10/minute)
```bash
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/v1/analytics/submit \
    -H "Content-Type: application/json" \
    -H "X-User-ID: test123" \
    -H "X-User-Tier: free" \
    -d '{
      "platform": "twitter",
      "content": "Rate limit test #test",
      "timestamp": "2024-02-06T12:00:00Z"
    }'
  echo -e "\n"
  sleep 1
done
```

#### b. Standard Tier Limits (50/minute)
```bash
# Similar to free tier test but with 51 iterations and "standard" tier
```

#### c. Premium Tier Limits (200/minute)
```bash
# Similar to free tier test but with 201 iterations and "premium" tier
```

### 5. Load Testing
```bash
# Requires Apache Bench (ab)
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test123" \
  -H "X-User-Tier: premium" \
  -p test_payload.json \
  http://localhost:3000/api/v1/analytics/submit

# Create test_payload.json:
echo '{
  "platform": "twitter",
  "content": "Load test #performance",
  "timestamp": "2024-02-06T12:00:00Z"
}' > test_payload.json
```

## Automated Testing Script
```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test health
echo -e "${GREEN}Testing Health Endpoint...${NC}"
curl http://localhost:3000/health

# Test sentiment analysis
echo -e "\n${GREEN}Testing Sentiment Analysis...${NC}"
curl -X POST http://localhost:3000/api/v1/analytics/submit \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test123" \
  -H "X-User-Tier: free" \
  -d '{
    "platform": "twitter",
    "content": "I love this amazing feature! #happy",
    "timestamp": "2024-02-06T12:00:00Z"
  }'

# Wait for processing
sleep 2

# Test dashboard
echo -e "\n${GREEN}Testing Dashboard Analytics...${NC}"
curl "http://localhost:3000/api/v1/analytics/dashboard?user_id=test123"

# Test rate limiting
echo -e "\n${GREEN}Testing Rate Limiting...${NC}"
for i in {1..11}; do
  echo -e "\n${GREEN}Request $i:${NC}"
  curl -X POST http://localhost:3000/api/v1/analytics/submit \
    -H "Content-Type: application/json" \
    -H "X-User-ID: test123" \
    -H "X-User-Tier: free" \
    -d '{
      "platform": "twitter",
      "content": "Rate limit test #test",
      "timestamp": "2024-02-06T12:00:00Z"
    }'
  sleep 1
done
```

Save as `test.sh` and run:
```bash
chmod +x test.sh
./test.sh
```

## Common Issues and Troubleshooting

### 1. Redis Connection Issues
```bash
# Check Redis connection
redis-cli ping

# Restart Redis
brew services restart redis

# Clear Redis cache
redis-cli FLUSHALL
```

### 2. Rate Limiting Issues
```bash
# Check current rate limit count
redis-cli GET "rate_limit:test123:free:minute"

# Check all rate limit keys
redis-cli KEYS "rate_limit:*"

# Delete specific rate limit
redis-cli DEL "rate_limit:test123:free:minute"
```

### 3. Data Verification
```bash
# List all submissions for a user
redis-cli ZRANGE "user:test123:submissions" 0 -1

# Get specific submission details
redis-cli HGETALL "submission:<submission_id>"
```

### 4. Server Issues
- Check server logs for errors
- Verify environment variables are set correctly
- Ensure required ports are available
- Monitor memory usage during load tests

## Best Practices
1. Clear Redis before running tests: `redis-cli FLUSHALL`
2. Use different user IDs for different test scenarios
3. Wait appropriate intervals between rate limit tests
4. Monitor server logs while testing
5. Verify data persistence after server restarts

## Rate Limits Reference
| Tier     | Requests/Minute | Requests/Hour |
|----------|----------------|---------------|
| Free     | 10            | 100           |
| Standard | 50            | 500           |
| Premium  | 200           | 2000          |
