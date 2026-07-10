const leakyBucket =
require("../src/services/limiter/leakyBucket");


const redisClient =
require("../src/config/redis");




// Connect Redis before tests

beforeAll(async () => {


    if(!redisClient.isOpen){


        await redisClient.connect();


    }


});





// Close Redis after tests

afterAll(async () => {


    await redisClient.quit();


});









test(
    "Leaky bucket should allow request when bucket has space",

    async () => {


        const key =
        "test:leaky";




        await redisClient.del(
            key
        );






        const result =
        await leakyBucket(

            key,

            5,

            1

        );







        expect(
            result.allowed
        )
        .toBe(true);


    }

);










test(
    "Leaky bucket should block when bucket is full",

    async () => {


        const key =
        "test:leaky:block";





        await redisClient.del(
            key
        );







        for(
            let i = 0;
            i < 5;
            i++
        ){


            await leakyBucket(

                key,

                5,

                0

            );


        }








        const result =
        await leakyBucket(

            key,

            5,

            0

        );







        expect(
            result.allowed
        )
        .toBe(false);


    }

);