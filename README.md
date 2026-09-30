# Rate Limiter API Gateway

A Node.js and Express API that authenticates API-key clients and applies Redis-backed rate limiting. It includes a React/Vite live demo and a Render Blueprint for a free-tier demonstration deployment.

The project demonstrates five rate-limiting strategies, MongoDB-backed API-key plans and request analytics, and Redis-compatible storage for short-lived limiter state. Free hosting is for demos, not production availability guarantees.



## Features

- API Key Authentication
- Multiple Rate Limiting Algorithms
- Redis Based Request Tracking
- MongoDB Usage Analytics
- Request Logging System
- Dockerized Application
- REST API Architecture
- Automated Testing with Jest
- React + Vite interactive frontend
- Render Blueprint deployment configuration



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

**Frontend**

- React
- Vite


**DevOps**

- Docker
- Docker Compose



## Project Structure


```text
Rate-Limiter

│
├── frontend              # React/Vite demo and static-site build
├── render.yaml           # Render Blueprint (API, static site, Key Value)
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
│   ├── API.md
│   ├── INTERVIEW_PREPARATION.md
│   ├── INTERVIEW_QUESTIONS.md
│   └── PROJECT_EXPLANATION.md
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
PORT=3001


MONGO_URI=mongodb://localhost:27017/rate-limiter


REDIS_URL=

REDIS_HOST=localhost

REDIS_PORT=6379

FRONTEND_URL=http://localhost:5173

NODE_ENV=development


RATE_LIMIT_ALGORITHM=fixed


RATE_LIMIT_MAX_REQUESTS=10


RATE_LIMIT_WINDOW=60


TOKEN_BUCKET_REFILL_RATE=1


LEAKY_BUCKET_RATE=1
```

Start by copying the sample, then set a reachable `MONGO_URI`:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env`. The sample MongoDB URI assumes MongoDB is running on the same host as the Node process.

`MONGO_URI` and a reachable Redis instance are required. `REDIS_URL` takes precedence; otherwise use `REDIS_HOST` and `REDIS_PORT`. `FRONTEND_URL` is the production browser-origin allowlist; loopback origins are allowed in development. `RATE_LIMIT_MAX_REQUESTS` is parsed by the config but does not set the effective test-route limit, which comes from the API-key plan in MongoDB. Never commit real connection strings.






## Installation


Clone repository


```bash
git clone <repository-url>
```

Configure `.env` as described above and make sure MongoDB and Redis are reachable before starting the API. The Compose file starts Redis and the API, but does not provision MongoDB; for a containerized API, `MONGO_URI` must point to a MongoDB host reachable from that container.



Install dependencies


```bash
npm install
```



Start development server


```bash
npm run dev
```

For the React demo, copy `frontend/.env.example` to `frontend/.env.local`, set `VITE_API_URL=http://localhost:3001`, then run:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Create a production build with `npm --prefix frontend run build`; output is `frontend/dist`.






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

Compose runs the API and Redis; it does not create MongoDB. Configure a MongoDB URI in `.env` before starting. The API container listens on 3001 and uses the Compose Redis hostname internally.






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

Successful test response:

```json
{
   "success": true,
   "message": "Rate Limiter Test API"
}
```

The API returns 429 with `{ "success": false, "algorithm": "fixed", "message": "Too Many Requests" }` when the selected limiter blocks the key. The actual algorithm value depends on `RATE_LIMIT_ALGORITHM`. The response may include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Window`, and, when produced by the algorithm, `Retry-After`.

### Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Lightweight deployment health response. |
| GET | `/` | Existing API status response. |
| POST | `/api/keys/generate` | Create a key from the `free`, `pro`, or `enterprise` plan. |
| GET | `/api/keys` | List API keys (currently unauthenticated; exposes key values). |
| GET | `/api/keys/usage/:key` | Read per-key usage. |
| PATCH | `/api/keys/disable/:key` | Disable a key. |
| GET | `/api/test` | API-key-authenticated, rate-limited test endpoint. |
| GET | `/api/admin/redis` | Redis connection and server statistics. |
| GET | `/api/admin/logs` | Up to 50 recent request logs. |

See [docs/API.md](docs/API.md) for response details and [docs/INTERVIEW_PREPARATION.md](docs/INTERVIEW_PREPARATION.md) for the complete implementation analysis.







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





## Render Deployment

The root `render.yaml` defines a free Node web service, a free static site, and a private 25 MB Render Key Value instance. Render injects `PORT`, wires the Key Value URL to `REDIS_URL`, and passes the API service URL to the frontend as `VITE_API_URL`. Supply `MONGO_URI` and the exact deployed frontend origin as `FRONTEND_URL` when prompted or in the Render dashboard. MongoDB is external to the Blueprint.

Free web services can sleep after 15 minutes idle and take about a minute to wake; free Key Value is non-persistent and limiter counters can reset on restart. These tiers suit a portfolio demo, not production availability requirements.

Deployment steps and troubleshooting: [docs/INTERVIEW_PREPARATION.md](docs/INTERVIEW_PREPARATION.md#16-render-deployment).

## Screenshots

<!-- Add a current frontend screenshot at docs/assets/rateguard.png. -->

## Interview Talking Points

- Limiter identity is the authenticated API key, not the request IP.
- MongoDB stores plan limits and analytics; Redis stores ephemeral algorithm state.
- Five algorithms are implemented; the default and Render Blueprint choice is fixed window.
- Redis state is shared, but multi-command algorithms are not all atomic under concurrent requests.
- Key-management/admin endpoints need authorization before public production use.

See [docs/INTERVIEW_PREPARATION.md](docs/INTERVIEW_PREPARATION.md), [docs/INTERVIEW_QUESTIONS.md](docs/INTERVIEW_QUESTIONS.md), and [docs/PROJECT_EXPLANATION.md](docs/PROJECT_EXPLANATION.md).

## Author

Developed by Aman Kumar Sharma