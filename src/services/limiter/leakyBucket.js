const redisClient =
require("../../config/redis");




// Leaky bucket rate limiting algorithm

const leakyBucket =
async (
    key,
    capacity,
    leakRate
) => {


    const now =
    Date.now();




    const bucket =
    await redisClient.hGetAll(
        key
    );





    let water;

    let lastLeak;





    if(
        Object.keys(bucket).length === 0
    ){


        water = 0;


        lastLeak =
        now;


    }
    else{


        water =
        Number(bucket.water) || 0;



        lastLeak =
        Number(bucket.lastLeak) || now;


    }






    // Remove requests based on leak rate

    const timePassed =
    (
        now - lastLeak
    )
    /
    1000;





    const leaked =
    Math.floor(

        timePassed *
        leakRate

    );





    water =
    Math.max(

        0,

        water - leaked

    );




    lastLeak =
    now;







    // Reject if bucket capacity is full

    if(
        water >= capacity
    ){


        return {


            allowed:
            false,


            remaining:
            0


        };


    }







    water++;







    await redisClient.hSet(

        key,

        {

            water,

            lastLeak

        }

    );





    // Remove unused bucket automatically

    await redisClient.expire(

        key,

        3600

    );







    return {


        allowed:
        true,


        remaining:
        capacity - water


    };


};





module.exports =
leakyBucket;