const redisClient =
require("../../config/redis");




// Fixed window rate limiting algorithm

const fixedWindow =
async (
    key,
    limit,
    windowTime
) => {


    const requests =
    await redisClient.incr(
        key
    );




    // Start expiry timer for a new window

    if(requests === 1){


        await redisClient.expire(

            key,

            windowTime

        );


    }





    const ttl =
    await redisClient.ttl(
        key
    );





    return {


        allowed:
        requests <= limit,



        limit,



        remaining:
        Math.max(

            limit - requests,

            0

        ),



        retryAfter:
        ttl


    };


};





module.exports =
fixedWindow;