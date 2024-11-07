# Rate-Limited Analytics API Service

A scalable API service that handles social media analytics processing with tier-based rate limiting and sentiment analysis.

## Features

- **Rate Limiting**: Tier-based rate limiting (Free, Standard, Premium)
- **Analytics Processing**: 
  - Hashtag extraction
  - Sentiment analysis
  - Platform-specific metrics
- **Time-Based Analytics**: Filter data by date ranges
- **Redis Backend**: Fast data storage and retrieval
- **RESTful API**: Clean and well-documented endpoints

## Prerequisites

- Node.js (v14 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rate-limiter-api.git
cd rate-limiter-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

4. Start Redis:
```bash
brew services start redis  # macOS
# or
sudo service redis start  # Linux
```

5. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Submit Analytics
```
POST /api/v1/analytics/submit
Headers:
  - X-User-ID: <user_id>
  - X-User-Tier: <free|standard|premium>
```

### Dashboard Analytics
```
GET /api/v1/analytics/dashboard?user_id=<user_id>&start_date=<date>&end_date=<date>&platform=<platform>
```

## Rate Limits

| Tier     | Requests/Minute | Requests/Hour |
|----------|----------------|---------------|
| Free     | 10            | 100           |
| Standard | 50            | 500           |
| Premium  | 200           | 2000          |

## Testing

1. Run automated tests:
```bash
npm test
```

2. Manual testing script:
```bash
chmod +x test.sh
./test.sh
```

See [API Testing Documentation](api_testing_documentation.md) for detailed testing instructions.

## Project Structure

```
.
├── src/
│   ├── app.js              # Main application file
│   ├── config/             # Configuration files
│   ├── middleware/         # Custom middleware
│   ├── routes/             # Route handlers
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── test/                   # Test files
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 429: Too Many Requests
- 500: Internal Server Error

Example error response:
```json
{
  "status": "error",
  "message": "Rate limit exceeded",
  "retry_after": 30
}
```

## Development

### Adding New Features

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git commit -m "Add: your feature description"
```

3. Push and create a pull request:
```bash
git push origin feature/your-feature-name
```

### Code Style

- Use ESLint for code linting
- Follow JavaScript Standard Style
- Add JSDoc comments for functions

## Deployment

### Docker

1. Build the image:
```bash
docker build -t rate-limiter-api .
```

2. Run the container:
```bash
docker run -p 3000:3000 rate-limiter-api
```

### Production Considerations

- Set NODE_ENV to 'production'
- Use a production Redis instance
- Configure appropriate logging levels
- Set up monitoring and alerts

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email your-email@example.com or create an issue in the GitHub repository.

## Acknowledgments

- Redis for the amazing in-memory data store
- Node.js community for excellent packages
- Contributors who helped improve the project # Rate_Limiter_for_API_Service
