const redisClient =
require("../../config/redis");




// Sliding log rate limiting algorithm

const slidingLog =
async (
    key,
    limit,
    windowTime
) => {


    const now =
    Date.now();




    const windowStart =
    now -
    (
        windowTime * 1000
    );





    // Remove requests outside current window

    await redisClient.zRemRangeByScore(

        key,

        0,

        windowStart

    );





    const requests =
    await redisClient.zCard(
        key
    );







    if(
        requests >= limit
    ){


        const ttl =
        await redisClient.ttl(
            key
        );



        return {


            allowed:
            false,


            remaining:
            0,


            retryAfter:
            ttl


        };


    }








    // Store current request timestamp

    await redisClient.zAdd(

        key,

        {

            score:
            now,


            value:
            `${now}-${Math.random()}`

        }

    );





    await redisClient.expire(

        key,

        windowTime

    );






    return {


        allowed:
        true,


        limit,


        remaining:
        limit - requests - 1


    };


};





module.exports =
slidingLog;