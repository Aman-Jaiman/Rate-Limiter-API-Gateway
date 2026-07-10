const redisClient =
require("../../config/redis");




// Sliding window counter rate limiting algorithm

const slidingWindow =
async (
    key,
    limit,
    windowTime
) => {


    const now =
    Math.floor(
        Date.now() / 1000
    );





    const currentWindow =
    Math.floor(
        now / windowTime
    );



    const previousWindow =
    currentWindow - 1;





    const currentKey =
    `${key}:${currentWindow}`;



    const previousKey =
    `${key}:${previousWindow}`;







    const currentCount =
    Number(

        await redisClient.get(
            currentKey
        )

    )
    ||
    0;







    const previousCount =
    Number(

        await redisClient.get(
            previousKey
        )

    )
    ||
    0;








    // Calculate previous window contribution

    const elapsed =
    now % windowTime;





    const weight =
    (
        windowTime - elapsed
    )
    /
    windowTime;







    const totalRequests =
    currentCount +
    (
        previousCount *
        weight
    );








    if(
        totalRequests >= limit
    ){


        const ttl =
        await redisClient.ttl(
            currentKey
        );



        return {


            allowed:
            false,


            limit,


            remaining:
            0,


            retryAfter:
            ttl


        };


    }








    await redisClient.incr(
        currentKey
    );





    // Keep current window for next calculation

    await redisClient.expire(

        currentKey,

        windowTime * 2

    );








    return {


        allowed:
        true,


        limit,


        remaining:
        Math.floor(

            limit -
            totalRequests -
            1

        )


    };


};





module.exports =
slidingWindow;