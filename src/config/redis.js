const {

    createClient

} = require("redis");





// Create Redis client connection

const redisClient =
createClient({


    socket: {


        host:
        process.env.REDIS_HOST
        ||
        "localhost",



        port:
        process.env.REDIS_PORT
        ||
        6379


    }


});





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