const slidingWindow =
require("../src/services/limiter/slidingWindow");


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
    "Sliding window should allow request inside limit",

    async () => {


        const key =
        "test:sliding-window";





        await redisClient.del(
            key
        );






        const result =
        await slidingWindow(

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
    "Sliding window should block request after limit",

    async () => {


        const key =
        "test:sliding-window:block";





        await redisClient.del(
            key
        );







        for(
            let i = 0;
            i < 5;
            i++
        ){


            await slidingWindow(

                key,

                5,

                60

            );


        }








        const result =
        await slidingWindow(

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