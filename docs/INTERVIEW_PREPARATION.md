# Rate Limiter — Interview Preparation

## 1. Project Overview

This project is an Express API that authenticates requests with API keys and applies one configurable rate-limiting algorithm using Redis. MongoDB stores API-key plans, per-key usage analytics, and request logs. It was built to demonstrate how an API can protect a route from excessive traffic while making the counter state shareable across backend instances.

The project supports fixed window, sliding log, sliding window counter, token bucket, and leaky bucket implementations. The default algorithm is `fixed`; Render's Blueprint also selects `fixed`. The API key's stored plan limit is the effective request limit.

**30-second answer:**

> I built a Node.js and Express rate-limiter API to demonstrate API-key-based traffic control. A request to the protected test endpoint is authenticated against MongoDB, then a configurable limiter uses Redis to maintain per-key state. The middleware allows the request to reach the handler or returns HTTP 429, and records usage and request logs in MongoDB. I implemented five limiter strategies and prepared a Render Blueprint with a static React/Vite demo, a web service, and Redis-compatible Key Value.

## 2. Architecture

```text
Browser / API client
        |
        v
Express app (Helmet, CORS, JSON parser, request logger)
        |
        +---- /health and /
        |
        +---- /api/test -> API-key lookup in MongoDB
        |                    |
        |                    v
        |             Rate-limiter middleware
        |                    |
        |                    +---- Redis counters/bucket state
        |                    |
        |                    +---- MongoDB usage + request log writes
        |                    |
        |                    v
        |             test controller or HTTP 429
        |
        +---- /api/keys and /api/admin routes
```

MongoDB is both the API-key/analytics database and the request-log store. Redis stores rate-limiter state. The static frontend calls the API directly; it does not proxy requests through the frontend server.

## 3. Request Flow

For `GET /api/test`:

1. The app applies Helmet, CORS, JSON parsing, and request logging.
2. The `/api` router mounts `/test`; the test route runs API-key auth, then rate-limit middleware, then the test controller.
3. API-key middleware reads the `x-api-key` header and looks up the key in MongoDB. A missing key produces 401; an unknown or disabled key produces 403.
4. The authenticated record supplies `apiKey` and its plan-specific `limit`. Client IP is logged but is not the limiter identity.
5. The middleware forms `rate-limit:<algorithm>:<apiKey>` and calls the configured limiter implementation in Redis. Sliding-window counter keys append a window index.
6. The limiter returns an allowed flag and available metadata. The middleware sends `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and applicable window/retry headers.
7. For a rejected request, the middleware increments blocked usage, writes a request log, and responds 429. Otherwise it updates usage, writes the log, and calls the controller.
8. The controller returns `{ "success": true, "message": "Rate Limiter Test API" }` with 200.

Redis state is changed before MongoDB analytics/logging writes. If a later Mongo write fails, the global handler can return 500 even though the Redis count was already consumed.

## 4. Rate Limiting Algorithm

The middleware selects one implementation using `RATE_LIMIT_ALGORITHM` (default `fixed`): `fixed`, `sliding-log`, `sliding-window`, `token`, or `leaky`. The active limit is `req.user.limit` from the API-key document. The configured `RATE_LIMIT_MAX_REQUESTS` is parsed into the config object but is not used by the middleware to override plan limits.

| Algorithm | Current implementation | Approximate work/state |
|---|---|---|
| Fixed window | Redis `INCR`; set expiry on the first increment; compare count with limit; read TTL. | O(1) commands and O(1) state per key/window. |
| Sliding log | Sorted set of request timestamps; remove old scores, count members, add a timestamp, and expire the key. | ZSET operations include O(log n) insertion and O(log n + m) range removal; O(n) timestamps in the active window. |
| Sliding window counter | Read current and previous integer counters; weight the previous count by the fraction of its window remaining; increment current counter and set a two-window TTL. | O(1) commands and two counter keys per API key/window. Approximate, not an exact rolling log. |
| Token bucket | Hash fields `tokens` and `lastRefill`; add whole tokens based on elapsed time, cap at capacity, and consume one. | O(1) commands and O(1) hash state per key. |
| Leaky bucket | Hash fields `water` and `lastLeak`; subtract whole leaked units based on elapsed time, then add a request if capacity remains. | O(1) commands and O(1) hash state per key. |

These are algorithmic operation counts, not end-to-end latency guarantees. Redis calls are network operations. In this code, compound operations such as ZSET check-and-add, sliding-window read-and-increment, and hash read-modify-write are not wrapped in Lua or a transaction. They can race under concurrent requests. Redis `INCR` itself is atomic, but the fixed-window increment/expiry flow is still multiple commands.

Fixed window is simple and memory-efficient but can allow a boundary burst across adjacent windows. Sliding log is more accurate but stores every accepted request. Sliding window counter uses less state and smooths boundaries but is an estimate. Buckets support replenishment/drain over time, but this implementation's multi-command state updates are not atomic.

## 5. Why Redis?

The counter and bucket state is short-lived, frequently updated, and needs to be visible to all API instances. Redis-compatible storage offers low-latency in-memory operations, native counters, sorted sets, hashes, and TTLs. The fixed-window counter uses Redis `INCR`; fixed/log/window implementations use expiry/TTL; bucket implementations store their state in hashes.

Only individual Redis commands such as `INCR` are atomic. The current multi-command algorithms do not provide an atomic whole-request decision under concurrency; a production hardening step would move their read/decide/write logic into Redis Lua scripts or another atomic primitive.

## 6. Why Not MongoDB for Counters?

MongoDB is used here for durable API-key documents, usage aggregates, and request logs. A MongoDB update can atomically update a single document, but using it for high-frequency ephemeral counters would add persistent-database write load and require extra expiry/cleanup behavior. Redis has native TTL and counter operations that fit this state better. The project still writes usage and a request log to MongoDB for every allowed or blocked request, so MongoDB remains on the request path for analytics.

## 7. HTTP 429

When the selected limiter returns `allowed: false`, the middleware records the blocked request and returns HTTP 429 with:

```json
{
  "success": false,
  "algorithm": "fixed",
  "message": "Too Many Requests"
}
```

The `algorithm` value reflects server configuration. The middleware also returns `X-RateLimit-Limit` and `X-RateLimit-Remaining` when the result contains those values. `X-RateLimit-Window` is emitted for fixed, sliding-log, and sliding-window algorithms. `Retry-After` is emitted only when the selected implementation returns a positive `retryAfter`; fixed-window returns the key TTL, while sliding-log/sliding-window can return a TTL on rejection. Token and leaky bucket do not currently return `retryAfter`, so that header is absent for those paths. These headers were added as observability metadata; they do not change allow/reject logic.

## 8. API Endpoints

All `/api` routes are mounted by `src/routes/index.routes.js`.

| Method | Endpoint | Purpose | Response / access |
|---|---|---|---|
| GET | `/health` | Lightweight deployment health check. | 200 `{ "status": "ok" }`; no DB query. |
| GET | `/` | Existing API health/info response. | 200 `{ "success": true, "message": "Rate Limiter API Running" }`. |
| POST | `/api/keys/generate` | Create a plan key; body is `{ "plan": "free" }`, `pro`, or `enterprise`. | 201 with `success` and `data: { apiKey, plan, limit }`; invalid plan is 400. No auth middleware. |
| GET | `/api/keys` | List API keys. | `success`, `total`, `data`; currently includes the key value. No auth middleware. |
| GET | `/api/keys/usage/:key` | Read stored usage for a key. | `success`, `usage`; unknown key is 404. No auth middleware. |
| PATCH | `/api/keys/disable/:key` | Disable a key. | `success`, `message`; unknown key is 404. No auth middleware. |
| GET | `/api/test` | Protected, rate-limited test route. | Requires `x-api-key`; returns the test JSON with 200 or the 429 body above. |
| GET | `/api/admin/redis` | Return Redis connected state, DB key count, and memory summary. | `success`, `data`. No auth middleware. |
| GET | `/api/admin/logs` | Return up to 50 newest request logs. | `success`, `total`, `data`. No auth middleware. |

Error responses use `{ "success": false, "message": "..." }`; a `stack` field is included only when `NODE_ENV=development` and a stack exists. Auth failures are 401 for missing and 403 for invalid/disabled keys.

## 9. Redis Data Model

The base key is `rate-limit:<algorithm>:<apiKey>`, for example `rate-limit:fixed:rl_<key>`. Avoid publishing real keys from logs or documentation.

- Fixed window: integer request count. Expiry is set when the first increment creates the key; subsequent requests read its TTL.
- Sliding log: sorted-set members use `<timestamp-ms>-<random>` and the score is the timestamp in milliseconds. Accepted-request writes refresh a window-length expiry.
- Sliding window counter: two integer keys based on the base key and Unix window index (`:<index>`). Current keys are kept for `2 * window` on writes.
- Token bucket: hash fields `tokens` and `lastRefill` (milliseconds); accepted updates set a 3600-second expiry.
- Leaky bucket: hash fields `water` and `lastLeak` (milliseconds); accepted updates set a 3600-second expiry.

Key expiry bounds most state. The sliding-log key can expire after its most recent accepted request; bucket hashes expire after an hour without an accepted write. Free Render Key Value is in-memory only and can lose all counters on restart. The client key itself and analytics are stored in MongoDB, not Redis.

## 10. Error Handling

- Missing API key: `AppError` 401; invalid/disabled key: 403.
- Invalid plan on key creation: 400; missing stored key for usage/disable: 404.
- Invalid algorithm: 500 through the global error handler.
- Redis errors are logged by the Redis client and request-time errors reach Express error handling as 500. Startup awaits MongoDB and Redis before listening; MongoDB connection failure exits the process.
- Unhandled errors default to 500 and `{success:false,message}`. Stack output is gated by `NODE_ENV === "development"`.
- The frontend adds network, timeout, invalid-JSON, and HTTP error messages; those are client-side handling, not extra backend response contracts.

## 11. Scalability

**Current implementation:** Redis is a shared external process/service, so instances configured with the same Redis URL see the same limiter keys. MongoDB holds shared API-key records and analytics. The code does not yet make every algorithm's multi-command check/update atomic, and analytics/log writes add MongoDB work per request. Render Free runs a single web instance and does not support scaling beyond one instance.

**Possible future improvements:** use Lua scripts for atomic limiter decisions; use connection timeouts/retry policies and health/readiness checks; protect management routes; add Mongo indexes/retention for log growth; decouple analytics writes; instrument latency, allowed/blocked counts, and Redis failures; then place multiple API instances behind a load balancer with shared Redis and a durable MongoDB deployment.

## 12. Security

API-key auth protects only `GET /api/test`. Key generation, key listing, usage, disabling, and admin routes currently have no authentication or authorization middleware. In particular, `GET /api/keys` returns raw API keys; do not expose this service publicly as-is without protecting those routes. Keys are stored as plain values in MongoDB, and key creation accepts plan names without a privileged caller check. No brute-force control is applied to key-management routes.

Production CORS is restricted to the comma-separated `FRONTEND_URL` allowlist; in non-production, loopback origins are also allowed. CORS is not authentication. Keep `MONGO_URI` and `REDIS_URL` in Render-managed environment settings; `.env` is ignored by Git. Use TLS/authenticated connections where your datastore provider requires them.

## 13. Deployment

```text
Browser
   |
   v
Render Static Site (React/Vite)
   |
   v
Render Free Web Service (Express API)
   |                         |
   v                         v
Render Key Value        MongoDB Atlas / external MongoDB
(Redis-compatible)
```

The included `render.yaml` defines the static site, Node web service, and private free Key Value in Oregon. Redis connection URL is injected from the Key Value service; `MONGO_URI` and `FRONTEND_URL` are prompted for in Render. MongoDB is external and must be supplied by the owner.

Render Free web services spin down after 15 minutes without inbound traffic and can take about a minute to wake. Free Key Value has 25 MB, is non-persistent, and loses data on restart. This project uses Redis for ephemeral limiter state, so restart resets counters; MongoDB remains responsible for API-key and request-log persistence. Free tiers are for evaluation/hobby usage, not production availability guarantees.

## 14. Environment Variables

| Variable | Purpose | Example/default | Required? |
|---|---|---|---|
| `PORT` | HTTP listen port. Render injects it. | Local fallback `3001` | No on Render; local default applies. |
| `MONGO_URI` | MongoDB connection string. | `mongodb://localhost:27017/rate-limiter` | Yes. |
| `REDIS_URL` | Complete Redis-compatible URL; takes precedence when non-empty. | `redis://localhost:6379` | Yes on Render; local alternative to host/port. |
| `REDIS_HOST` | Redis host when URL is absent. | `localhost` locally, `redis` in Compose | Alternative to `REDIS_URL`. |
| `REDIS_PORT` | Redis port when URL is absent. | `6379` | Alternative to `REDIS_URL`. |
| `FRONTEND_URL` | Comma-separated production browser-origin allowlist. | `http://localhost:5173` | Set for deployed frontend. |
| `NODE_ENV` | Controls stack inclusion in error responses. | `development`; Render uses `production` | No. |
| `RATE_LIMIT_ALGORITHM` | Selects limiter strategy. | `fixed` | No; default `fixed`. |
| `RATE_LIMIT_WINDOW` | Window seconds for fixed/log/sliding-window. | `60` | No. |
| `TOKEN_BUCKET_REFILL_RATE` | Whole tokens replenished per second. | `1` | No. |
| `LEAKY_BUCKET_RATE` | Whole units leaked per second. | `1` | No. |
| `RATE_LIMIT_MAX_REQUESTS` | Parsed by rate-limit config, but not used as the active limit. | `10` | No; API-key plan limit wins. |
| `VITE_API_URL` | Frontend build-time API origin. | `http://localhost:3001` in `frontend/.env.local` | Yes for frontend builds. |

## 15. Local Development

1. Configure a MongoDB instance and copy `.env.example` to `.env`; set `MONGO_URI`.
2. Start Redis locally or set `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` to the reachable instance. `docker compose up -d redis` exposes the Compose Redis port on host port 6380; a host-run Node process therefore needs `REDIS_PORT=6380` unless you change the mapping.
3. From the repository root run `npm install` and `npm run dev`. The API listens on port 3001 by default.
4. In `frontend/`, copy `.env.example` to `.env.local`, run `npm install`, then `npm run dev`. The frontend requires `VITE_API_URL=http://localhost:3001`.
5. Run the frontend production build with `npm --prefix frontend run build`.

The root Jest tests exercise the limiter modules against a live Redis connection; they do not cover HTTP routing, CORS, or full API integration.

## 16. Render Deployment

1. Push the repository and `render.yaml` to GitHub.
2. In Render, create a Blueprint from that repository.
3. Create a MongoDB database outside this Blueprint (for example, an appropriately configured MongoDB Atlas deployment) and obtain its connection string.
4. During initial Blueprint setup, enter `MONGO_URI` and the frontend's eventual Render URL for `FRONTEND_URL`. After creation, verify `FRONTEND_URL` matches the static site's exact origin.
5. The Blueprint builds the API with `npm ci` and starts it with `npm start`; Render injects `PORT`. Health check is `/health`.
6. Render creates the static site with `npm --prefix frontend ci && npm --prefix frontend run build`, publishes `frontend/dist`, and injects the API service's `RENDER_EXTERNAL_URL` as `VITE_API_URL`.
7. Wait for the services to deploy. If necessary, update `FRONTEND_URL` in the API service settings and redeploy it.
8. Verify `https://<api-host>/health` returns `{ "status": "ok" }`.
9. Open the static-site URL, create a free API key, send requests, and verify 200 responses then 429. Check API logs and the Redis/Mongo service status if startup fails.

## 17. Common Deployment Problems

- **Wrong port / unreachable service:** bind to `process.env.PORT` and `0.0.0.0`; do not hardcode Render's port. Local fallback is 3001.
- **API reports unhealthy:** `/health` is lightweight, but the server only begins listening after MongoDB and Redis connect. Check startup logs and both datastore URLs.
- **Redis DNS/connection error:** use Render Key Value's internal `REDIS_URL` in the same region, or correct `REDIS_HOST`/`REDIS_PORT`. Do not use the Docker service hostname from a host-run process.
- **Mongo connection failure:** check `MONGO_URI`, database user/password encoding, network access rules, and provider-side IP policy. Never paste credentials into YAML or Git.
- **Browser CORS error:** set `FRONTEND_URL` to the exact static-site origin (scheme and hostname; no path), comma-separated only when allowing multiple known origins. Redeploy API after changing it.
- **Frontend calls wrong origin:** `VITE_API_URL` is embedded at build time. Check the static service's configured value and trigger a new build after changes.
- **Cold first response:** a free Render web service can sleep after 15 idle minutes; its first request can take about a minute to wake.
- **Counters reset:** free Key Value is volatile and may restart; this is expected for the free tier. Do not treat Redis state as durable data.
- **429 retry header absent:** `Retry-After` is conditional on the chosen algorithm's result; token and leaky bucket currently do not return it.
- **Key appears invalid:** key must exist and be active in the same MongoDB database the API uses; supply it in the `x-api-key` header.
