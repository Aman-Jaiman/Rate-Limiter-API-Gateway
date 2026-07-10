const redisClient =
require("../../config/redis");




// Token bucket rate limiting algorithm

const tokenBucket =
async (
    key,
    capacity,
    refillRate
) => {


    const now =
    Date.now();




    const bucket =
    await redisClient.hGetAll(
        key
    );





    let tokens;

    let lastRefill;





    if(
        Object.keys(bucket).length === 0
    ){


        tokens =
        capacity;



        lastRefill =
        now;


    }
    else{


        tokens =
        Number(bucket.tokens)
        ||
        0;



        lastRefill =
        Number(bucket.lastRefill)
        ||
        now;


    }







    // Add tokens based on elapsed time

    const timePassed =
    (
        now - lastRefill
    )
    /
    1000;





    const tokensToAdd =
    Math.floor(

        timePassed *
        refillRate

    );





    tokens =
    Math.min(

        capacity,

        tokens + tokensToAdd

    );





    lastRefill =
    now;








    // Reject request when no tokens available

    if(
        tokens <= 0
    ){


        return {


            allowed:
            false,


            limit:
            capacity,


            remaining:
            0


        };


    }








    tokens--;








    await redisClient.hSet(

        key,

        {

            tokens,

            lastRefill

        }

    );





    // Remove inactive bucket automatically

    await redisClient.expire(

        key,

        3600

    );








    return {


        allowed:
        true,


        limit:
        capacity,


        remaining:
        tokens


    };


};





module.exports =
tokenBucket;