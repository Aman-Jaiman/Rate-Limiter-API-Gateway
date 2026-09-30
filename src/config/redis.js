const {

    createClient

} = require("redis");





// Prefer a complete URL for managed Redis-compatible services.
const redisOptions = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379
        }
    };

const redisClient = createClient(redisOptions);





// Redis connection error handler

redisClient.on(
    "error",
    (error) => {


        console.error(

            "Redis Error:",

            error.message

        );


    }
);





// Runs when Redis connects successfully

redisClient.on(
    "connect",
    () => {


        console.log(
            "Redis Connected"
        );


    }
);





module.exports =
redisClient;