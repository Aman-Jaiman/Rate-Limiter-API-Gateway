# Rate Limiter — Interview Questions

Answers are phrased for speaking aloud and describe this repository's current behavior. Follow-ups often point to limitations or next steps rather than claiming they are already implemented.

## Beginner

### 1. What is rate limiting?
**Question:** What problem does rate limiting solve?
**Answer:** It bounds how frequently a client can call an endpoint during a policy interval, helping reduce accidental overload and some forms of abuse.
**Why:** It tests the purpose without overstating this project as a complete security layer.
**Follow-up question:** What kinds of abuse still need separate controls?

### 2. What does HTTP 429 mean?
**Question:** When does this API return 429?
**Answer:** The authenticated API key has exhausted the capacity of the configured limiter. The middleware logs the blocked attempt and returns a JSON error with the selected algorithm name.
**Why:** It connects the HTTP code to the exact middleware decision.
**Follow-up question:** Does every algorithm return a `Retry-After` header here?

### 3. What is Express middleware?
**Question:** Why is the rate limiter middleware in Express?
**Answer:** Middleware runs between request routing and the controller. Here the test route composes API-key authentication, the limiter, and then the test handler.
**Why:** It explains the actual route composition pattern.
**Follow-up question:** How would you share a limiter policy across several routes?

### 4. What is Redis used for?
**Question:** What data does Redis hold in this project?
**Answer:** It holds short-lived limiter state: integer counters, sorted-set request timestamps, or bucket hashes depending on the configured algorithm.
**Why:** It distinguishes Redis state from persistent application data.
**Follow-up question:** What happens to these values when a key expires?

### 5. How does the API identify a client?
**Question:** Is the limiter keyed by IP address?
**Answer:** No. Authentication reads `x-api-key`; the API-key value is the limiter identity. The request IP is stored in request logs but does not determine the limit.
**Why:** It catches a common assumption when reading rate-limit APIs.
**Follow-up question:** What trade-offs would IP-based limiting introduce?

### 6. What does the test endpoint return?
**Question:** What is the successful response from `GET /api/test`?
**Answer:** With a valid active key and available capacity, it returns HTTP 200 with `success: true` and the message `Rate Limiter Test API`.
**Why:** It verifies knowledge of the real response contract.
**Follow-up question:** What response is returned when the limit is exceeded?

### 7. Where does the limit value come from?
**Question:** How is an API key's request limit chosen?
**Answer:** Key generation maps `free`, `pro`, and `enterprise` to 10, 100, and 1000 requests respectively and stores that limit in MongoDB. Auth middleware attaches that stored limit to the request.
**Why:** It separates plan limits from environment configuration.
**Follow-up question:** Does `RATE_LIMIT_MAX_REQUESTS` currently override the plan value?

### 8. What do the response headers show?
**Question:** Which rate-limit headers can the browser read?
**Answer:** The middleware sets `X-RateLimit-Limit`, `X-RateLimit-Remaining` when available, and a window header for fixed/sliding algorithms. `Retry-After` is emitted only when that algorithm returns a positive retry value.
**Why:** It reflects the implementation and CORS exposure.
**Follow-up question:** Which bucket implementations currently provide a retry value?

### 9. What is the health endpoint?
**Question:** What does `/health` verify?
**Answer:** It returns `{ "status": "ok" }` without querying MongoDB or Redis. The process itself only starts listening after the startup connections succeed, but the handler does not independently probe them.
**Why:** It makes the distinction between liveness and dependency readiness clear.
**Follow-up question:** How would you add a separate readiness check?

### 10. What does MongoDB store?
**Question:** Why is MongoDB in this project?
**Answer:** It stores API-key documents, per-key usage totals and last-used time, and request log documents. The limiter counters themselves are stored in Redis.
**Why:** It tests the separation between operational counter state and application records.
**Follow-up question:** What cost does writing analytics on each request introduce?

## Intermediate

### 11. How does fixed window work here?
**Question:** Walk through the fixed-window implementation.
**Answer:** It increments one Redis integer key, sets the key expiry when the first request creates it, reads its TTL, and allows the request only while the count is at or below the API-key limit.
**Why:** It focuses on the actual Redis operations rather than a generic description.
**Follow-up question:** What happens near a window boundary?

### 12. What is the fixed-window boundary issue?
**Question:** Why can fixed window allow a burst?
**Answer:** A client can use its full quota just before one fixed interval ends and another full quota just after the next interval begins. This implementation does not smooth the boundary.
**Why:** It shows awareness of algorithm behavior and trade-offs.
**Follow-up question:** Which implemented algorithm approximates a rolling window with less state?

### 13. How does sliding log work?
**Question:** What does the sliding-log algorithm store?
**Answer:** It stores accepted request timestamps as sorted-set scores, removes scores older than the configured window, counts remaining members, and adds the current request if capacity remains.
**Why:** It checks understanding of both ZSET state and rolling-window semantics.
**Follow-up question:** What is its memory cost compared with a counter?

### 14. How does the sliding-window counter work?
**Question:** How does this implementation smooth fixed-window boundaries?
**Answer:** It reads the current and previous window counts, weights the previous count by the portion of the prior window overlapping the rolling interval, and compares the weighted total with the limit.
**Why:** It distinguishes an estimate from an exact timestamp log.
**Follow-up question:** What can make the estimate inaccurate under concurrency?

### 15. Explain the token bucket.
**Question:** How does this project's token bucket refill?
**Answer:** A Redis hash stores `tokens` and `lastRefill`. Elapsed time adds whole tokens at `TOKEN_BUCKET_REFILL_RATE`, capped at capacity; an accepted request consumes one token.
**Why:** It grounds the explanation in stored fields and configured rate.
**Follow-up question:** How would fractional refill or atomic updates change the design?

### 16. Explain the leaky bucket.
**Question:** How does the leaky bucket implementation update state?
**Answer:** Its hash stores `water` and `lastLeak`. It subtracts whole leaked units based on elapsed time and `LEAKY_BUCKET_RATE`, then adds the request if the bucket is below capacity.
**Why:** It describes the code's counter-based simulation without claiming a separate queue exists.
**Follow-up question:** How would a queue-based leaky bucket differ?

### 17. Why use TTL?
**Question:** What is the purpose of Redis expiration here?
**Answer:** Expiration removes inactive limiter state automatically. Fixed and sliding algorithms use window-related TTLs; token and leaky bucket hashes expire after 3600 seconds on accepted writes.
**Why:** It connects memory management to the actual key lifecycle.
**Follow-up question:** What could happen if a process crashes between `INCR` and `EXPIRE`?

### 18. Is Redis `INCR` atomic?
**Question:** Are the rate-limit decisions atomic under concurrency?
**Answer:** Redis `INCR` is atomic as a command, but a whole limiter decision is not consistently one atomic operation. Sliding-log and bucket implementations perform multiple reads/writes, and sliding-window reads before incrementing.
**Why:** It avoids overclaiming Redis atomicity.
**Follow-up question:** What Redis feature could make the compound operation atomic?

### 19. How would you address race conditions?
**Question:** What would you change to make concurrent decisions consistent?
**Answer:** I would move each algorithm's read, decision, state update, and relevant expiry into a Redis Lua script, then add concurrency-focused integration tests.
**Why:** It suggests a concrete fix at the storage boundary.
**Follow-up question:** What should those tests assert with many parallel requests?

### 20. What happens when Redis is unavailable?
**Question:** How does the service behave on a Redis failure?
**Answer:** Startup awaits Redis connection before listening. Redis emits logged errors, and request-time limiter errors are passed to Express error handling, which returns a 500 by default. There is no fail-open/fail-closed policy switch.
**Why:** It assesses availability behavior without inventing fallback logic.
**Follow-up question:** Which failure policy would you choose for a payment API, and why?

### 21. Why write analytics to MongoDB on each request?
**Question:** What is the effect of usage and log writes in the middleware?
**Answer:** Every allowed and blocked request updates usage and creates a request-log document. This supplies usage/admin data, but adds MongoDB work and latency to the request path; a failed write can return 500 after Redis state changed.
**Why:** It identifies an important operational coupling.
**Follow-up question:** How could analytics be moved off the critical path?

## Advanced

### 22. Can multiple API instances share limits?
**Question:** What is required to horizontally scale this API without per-instance counters?
**Answer:** Every instance must use the same Redis-compatible datastore and MongoDB database, and each algorithm needs concurrency-safe state transitions. A load balancer can then distribute requests among instances.
**Why:** It distinguishes shared state from local memory.
**Follow-up question:** What impact would Redis failover or replication lag have?

### 23. Are the limiter algorithms distributed?
**Question:** Does storing state in Redis make the complete limiter decision distributed and race-free?
**Answer:** It makes state shared, but not every decision atomic. Multiple instances still can interleave multi-command checks and writes, so shared Redis alone is not a complete consistency guarantee.
**Why:** It probes an important distinction between shared storage and atomic policy enforcement.
**Follow-up question:** Which implementations have the largest check/update race window?

### 24. Why Lua scripts?
**Question:** Why would you use a Redis Lua script for limiting?
**Answer:** Redis executes a script atomically relative to other commands. It can combine reading state, calculating allowance, updating the counter, and setting expiry without another request interleaving.
**Why:** It proposes an implementation appropriate to Redis-backed counters.
**Follow-up question:** How would you test and version scripts safely?

### 25. Should the API fail open or fail closed?
**Question:** What should the service do if Redis becomes unavailable?
**Answer:** The current behavior is effectively an error response, not a configured fail-open or fail-closed choice. The correct policy depends on the endpoint: fail-closed protects scarce resources, while fail-open favors availability but removes protection.
**Why:** It makes the trade-off explicit and correctly reports current behavior.
**Follow-up question:** How would you communicate degraded limiter state to operators?

### 26. Is the configured global max request count effective?
**Question:** Does `RATE_LIMIT_MAX_REQUESTS` control the test endpoint?
**Answer:** No. It is parsed into `rateLimit.config.limit`, but the middleware passes `req.user.limit` from the MongoDB API-key document to the limiter. The plan-stored value is effective.
**Why:** It tests source-level tracing and exposes an env setting that could confuse operators.
**Follow-up question:** Would you remove the setting or define a clear precedence rule?

### 27. What security risks remain?
**Question:** Is API-key auth enough to secure the service?
**Answer:** No. It only protects `GET /api/test`. Key generation/listing, usage, disable, and admin routes have no auth middleware, and key listing returns plaintext keys. Those routes need authorization before a public production deployment.
**Why:** It demonstrates a realistic security assessment.
**Follow-up question:** How would you limit access to the administrative API?

### 28. Is CORS a security boundary?
**Question:** Does the production CORS allowlist secure the API?
**Answer:** It restricts which browser origins can read responses, but it is not authentication and does not stop direct HTTP clients. API authorization and datastore secret controls are separate requirements.
**Why:** It tests common CORS misconceptions.
**Follow-up question:** Which routes should require an admin role or service credential?

### 29. What are high-traffic bottlenecks?
**Question:** What would you measure first under high traffic?
**Answer:** I would measure Redis command latency and contention, MongoDB write latency and pool saturation, API p95/p99 latency, blocked-rate distribution, and error rates. The current per-request Mongo writes are a likely pressure point.
**Why:** It is grounded in this request path rather than generic cloud advice.
**Follow-up question:** Which metrics would you emit without logging secrets?

### 30. How would you choose among the five algorithms?
**Question:** How would you choose a limiter algorithm for a product endpoint?
**Answer:** Fixed window is simplest and cheap; sliding log is more precise but stores each accepted timestamp; sliding counter trades exactness for low state; token bucket allows bursts with refill; leaky bucket drains capacity at a steady rate. The endpoint's burst and smoothness requirements determine the choice.
**Why:** It links policy needs to the implemented alternatives.
**Follow-up question:** Which one is configured in this project's Render Blueprint?

### 31. Can clients always rely on `Retry-After`?
**Question:** Will every 429 include an accurate `Retry-After` value?
**Answer:** No. The header is set only when an algorithm returns a positive `retryAfter`. Fixed window returns Redis TTL; sliding log/window can return TTL on rejection; token and leaky bucket do not currently return it. It should be treated as available metadata, not a universal contract.
**Why:** It checks the conditional behavior added to the response headers.
**Follow-up question:** What state would each bucket need to calculate a retry estimate?

### 32. What are the Render Free trade-offs?
**Question:** What limitations matter for this deployment?
**Answer:** Free web services sleep after 15 minutes idle and can take about a minute to wake. Free Key Value is 25 MB and non-persistent, so Redis state resets on restart. It is suitable for a demo, not an availability guarantee.
**Why:** It shows a deployment-ready understanding of free-tier behavior.
**Follow-up question:** Which data must remain durable across those restarts?
