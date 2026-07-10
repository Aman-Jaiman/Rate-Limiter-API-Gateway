const slidingLog =
require("../src/services/limiter/slidingLog");


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
    "Sliding log should allow request inside limit",

    async () => {


        const key =
        "test:sliding-log";




        await redisClient.del(
            key
        );





        const result =
        await slidingLog(

            key,

            5,

            60

        );





        expect(
            result.allowed
        )
        .toBe(true);


    }

);










test(
    "Sliding log should block after limit exceeded",

    async () => {


        const key =
        "test:sliding-log:block";





        await redisClient.del(
            key
        );







        for(
            let i = 0;
            i < 5;
            i++
        ){


            await slidingLog(

                key,

                5,

                60

            );


        }








        const result =
        await slidingLog(

            key,

            5,

            60

        );








        expect(
            result.allowed
        )
        .toBe(false);


    }

);