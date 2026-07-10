// Store rate limiting configuration from environment variables

const rateLimitConfig = {


    algorithm:
    process.env.RATE_LIMIT_ALGORITHM
    ||
    "fixed",



    limit:
    Number(
        process.env.RATE_LIMIT_MAX_REQUESTS
    )
    ||
    10,



    window:
    Number(
        process.env.RATE_LIMIT_WINDOW
    )
    ||
    60,



    refillRate:
    Number(
        process.env.TOKEN_BUCKET_REFILL_RATE
    )
    ||
    1,



    leakRate:
    Number(
        process.env.LEAKY_BUCKET_RATE
    )
    ||
    1


};




module.exports =
rateLimitConfig;