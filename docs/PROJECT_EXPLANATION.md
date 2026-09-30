# 60-Second Project Explanation

> I built a rate-limiter API with Node.js and Express to demonstrate how an API can control excessive traffic per client key. A client sends an `x-api-key` header to the protected test route. The API looks up that key and its plan limit in MongoDB, then the rate-limiter middleware uses Redis to update and evaluate per-key state. The default strategy is fixed window, and the project also includes sliding log, sliding-window counter, token bucket, and leaky bucket implementations. Allowed requests receive the test response; requests over capacity are logged and return HTTP 429. MongoDB stores API-key records, usage totals, and request logs, while Redis holds the short-lived counters and bucket state. I prepared a Render Blueprint for a static React/Vite demo, an Express web service, and a private Redis-compatible Key Value. The free deployment is for demonstration: the API can sleep when idle and free Redis state can reset on restart.

## Speaking Notes

- Say the limit is per API key, not per IP.
- Say MongoDB supplies each key's plan limit; `RATE_LIMIT_MAX_REQUESTS` is currently not the effective route limit.
- Describe Redis counters as shared state, but do not claim all multi-command algorithms are race-free; atomic scripts are a future improvement.
- `Retry-After` is conditional and is not returned by the token/leaky implementations today.
- The management/admin endpoints need authorization before the service is treated as a secure public production API.
