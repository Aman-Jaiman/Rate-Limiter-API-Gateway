# Rate Limiter API Documentation


Base URL

```text
http://localhost:3001/api
```

The health endpoints are mounted at the API origin, outside the `/api` prefix.


## Health Checks

### Deployment health

```http
GET /health
```

Response:

```json
{
    "status": "ok"
}
```

This handler is lightweight and does not query MongoDB or Redis.

### Existing root status

Check if server is running.


### Request

```http
GET /
```


### Response

```json
{
    "success": true,
    "message": "Rate Limiter API Running"
}
```

# API Key Management


## Generate API Key


Creates a new API key based on a plan.


### Endpoint

```http
POST /keys/generate
```


### Body

```json
{
    "plan": "free"
}
```


Available plans:

```text
free
pro
enterprise
```


### Response

```json
{
    "success": true,

    "data": {

        "apiKey": "rl_generated_key",

        "plan": "free",

        "limit": 10
    }
}
```





## Get All API Keys


### Endpoint

```http
GET /keys
```


### Response

```json
{
    "success": true,

    "total": 2,

    "data": []
}
```





## Get API Key Usage


### Endpoint

```http
GET /keys/usage/:key
```


### Response

```json
{
    "success": true,

    "usage": {

        "totalRequests": 50,

        "blockedRequests": 5,

        "lastUsed": "date"
    }
}
```





## Disable API Key


### Endpoint

```http
PATCH /keys/disable/:key
```


### Response

```json
{
    "success": true,

    "message": "API Key Disabled"
}
```







# Rate Limited API


Protected endpoint used for testing algorithms.



## Test API


### Endpoint

```http
GET /test
```


### Headers

```text
x-api-key: your_api_key
```


### Success Response

```json
{
    "success": true,

    "message": "Rate Limiter Test API"
}
```



### Rate Limit Exceeded

Status:

```text
429 Too Many Requests
```


Response:

```json
{
    "success": false,

    "algorithm": "fixed",

    "message": "Too Many Requests"
}
```

`algorithm` reflects `RATE_LIMIT_ALGORITHM`; `fixed` is the default/example value.

### Rate Limit Headers

The middleware returns `X-RateLimit-Limit` and `X-RateLimit-Remaining` when the selected algorithm provides those values. It returns `X-RateLimit-Window` for `fixed`, `sliding-log`, and `sliding-window`. `Retry-After` is conditional: it is sent only when the algorithm returns a positive retry value. Token and leaky bucket do not currently provide one.

These headers are exposed through CORS for the configured frontend origin.








# Admin APIs


## Redis Statistics


Returns Redis server information.


### Endpoint

```http
GET /admin/redis
```


### Response

```json
{
    "success": true,

    "data": {

        "connected": true,

        "keys": 5,

        "memory": "2MB"
    }
}
```







## Request Logs


Returns latest API request logs.


### Endpoint

```http
GET /admin/logs
```


### Response

```json
{
    "success": true,

    "total": 10,

    "data": []
}
```








# Supported Algorithms


This project supports five rate limiting algorithms.


```text
Fixed Window

Sliding Log

Sliding Window Counter

Token Bucket

Leaky Bucket
```








# Status Codes


| Code | Meaning |
|----|----|
| 200 | Success |
| 201 | Created |
| 401 | API Key Missing |
| 403 | Invalid / Disabled API Key |
| 429 | Too Many Requests |
| 500 | Server Error |