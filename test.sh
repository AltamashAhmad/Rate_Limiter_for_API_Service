#!/bin/bash

# Test health
echo "Testing Health Endpoint..."
curl http://localhost:3000/health

# Test Submit Endpoint
echo "
Testing Submit Endpoint..."
curl -X POST http://localhost:3000/api/v1/analytics/submit   -H "Content-Type: application/json"   -H "X-User-ID: test123"   -H "X-User-Tier: free"   -d '{
    "platform": "twitter",
    "content": "Testing the API #test #nodejs",
    "timestamp": "2024-02-06T12:00:00Z"
  }'

# Test Dashboard Endpoint
echo "
Testing Dashboard Endpoint..."
curl "http://localhost:3000/api/v1/analytics/dashboard?user_id=test123"

# Test Rate Limiting
echo "
Testing Rate Limiting..."
for i in {1..11}; do
  echo "
Request $i:"
  curl -X POST http://localhost:3000/api/v1/analytics/submit     -H "Content-Type: application/json"     -H "X-User-ID: test123"     -H "X-User-Tier: free"     -d '{
      "platform": "twitter",
      "content": "Rate limit test #test",
      "timestamp": "2024-02-06T12:00:00Z"
    }'
  sleep 1
done