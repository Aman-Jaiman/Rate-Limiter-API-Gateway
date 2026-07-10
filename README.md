# Rate Limiter API Gateway

A production-style API Rate Limiter built with Node.js, Express, Redis, MongoDB, and Docker.

The system controls API traffic using multiple rate limiting algorithms, API key authentication, usage analytics, request logging, and Redis based high-performance storage.



## Features

- API Key Authentication
- Multiple Rate Limiting Algorithms
- Redis Based Request Tracking
- MongoDB Usage Analytics
- Request Logging System
- Dockerized Application
- REST API Architecture
- Automated Testing with Jest



## Rate Limiting Algorithms

Implemented algorithms:

- Fixed Window Counter
- Sliding Log
- Sliding Window Counter
- Token Bucket
- Leaky Bucket



## Tech Stack

**Backend**

- Node.js
- Express.js


**Database**

- MongoDB
- Mongoose


**Caching**

- Redis


**Testing**

- Jest
- Supertest


**DevOps**

- Docker
- Docker Compose



## Project Structure


```text
Rate-Limiter

│
├── src
│   │
│   ├── config
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── rateLimit.config.js
│   │
│   ├── constants
│   │   └── rateLimit.js
│   │
│   ├── controllers
│   │   ├── admin.controller.js
│   │   ├── apiKey.controller.js
│   │   └── test.controller.js
│   │
│   ├── errors
│   │   └── AppError.js
│   │
│   ├── middleware
│   │   ├── apiKey.js
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── rateLimiter.js
│   │
│   ├── models
│   │   ├── apiKey.model.js
│   │   └── requestLog.model.js
│   │
│   ├── routes
│   │   ├── admin.routes.js
│   │   ├── apiKey.routes.js
│   │   ├── index.routes.js
│   │   └── test.routes.js
│   │
│   ├── services
│   │   ├── limiter
│   │   │   ├── fixedWindow.js
│   │   │   ├── slidingLog.js
│   │   │   ├── slidingWindow.js
│   │   │   ├── tokenBucket.js
│   │   │   └── leakyBucket.js
│   │   ├── analytics.service.js
│   │   ├── log.service.js
│   │   └── redis.service.js
│   │
│   ├── utils
│   │   ├── asyncHandler.js
│   │   ├── redisKeys.js
│   │   ├── response.js
│   │   └── time.js
│   │
│   └── app.js
│
├── tests
│   ├── fixedWindow.test.js
│   ├── leakyBucket.test.js
│   ├── slidingLog.test.js
│   ├── slidingWindow.test.js
│   └── tokenBucket.test.js
│
├── docs
│   └── API.md
│
├── .dockerignore
├── .env.example
├── .gitignore
│
├── Dockerfile
├── docker-compose.yml
│
├── jest.config.js
│
├── package.json
├── package-lock.json
│
├── server.js
└── README.md
```



## Environment Variables


Create `.env` file:


```env
PORT=3000


MONGO_URI=your_mongodb_connection_string


REDIS_HOST=redis

REDIS_PORT=6379


RATE_LIMIT_ALGORITHM=fixed


RATE_LIMIT_MAX_REQUESTS=10


RATE_LIMIT_WINDOW=60


TOKEN_BUCKET_REFILL_RATE=1


LEAKY_BUCKET_RATE=1
```






## Installation


Clone repository


```bash
git clone <repository-url>
```



Install dependencies


```bash
npm install
```



Start development server


```bash
npm run dev
```






## Run With Docker


Build and start containers:


```bash
docker compose up --build
```



Run in background:


```bash
docker compose up -d
```



Stop containers:


```bash
docker compose down
```






## API Usage


Generate API key:


```http
POST /api/keys/generate
```


Body:


```json
{
    "plan":"free"
}
```



Use API key:


```http
GET /api/test
```


Header:


```text
x-api-key: your_api_key
```







## Admin APIs


Redis Stats:


```http
GET /api/admin/redis
```



Request Logs:


```http
GET /api/admin/logs
```







## Testing


Run all tests:


```bash
npm test
```


Test coverage:


```text
Fixed Window

Sliding Log

Sliding Window Counter

Token Bucket

Leaky Bucket
```








## System Design


```text

Client

  |

  v

API Key Middleware

  |

  v

Rate Limiter Middleware

  |

  +--------------+
  |              |
  v              v

Redis        MongoDB

(cache)      (analytics/logs)

```








## Rate Limiter Flow


```text

Request

   |

Check API Key

   |

Select Algorithm

   |

Check Redis Limit

   |

Allowed?

   |
   +--------+
   |        |
  Yes       No

   |        |

API       429 Response

```








## Future Improvements

- JWT Dashboard
- User Accounts
- Redis Cluster Support
- Kubernetes Deployment
- Prometheus Monitoring





## Author

Developed by Aman Kumar Sharma