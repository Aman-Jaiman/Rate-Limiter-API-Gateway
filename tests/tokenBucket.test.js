const tokenBucket =
require("../src/services/limiter/tokenBucket");


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
    "Token bucket should allow request when token exists",

    async () => {


        const key =
        "test:token";




        await redisClient.del(
            key
        );





        const result =
        await tokenBucket(

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
    "Token bucket should block when tokens are empty",

    async () => {


        const key =
        "test:token:block";





        await redisClient.del(
            key
        );







        for(
            let i = 0;
            i < 5;
            i++
        ){


            await tokenBucket(

                key,

                5,

                0

            );


        }








        const result =
        await tokenBucket(

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