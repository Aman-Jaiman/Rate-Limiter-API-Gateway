const fixedWindow =
require("../src/services/limiter/fixedWindow");


const redisClient =
require("../src/config/redis");




// Connect Redis before running tests

beforeAll(async () => {


    if(!redisClient.isOpen){


        await redisClient.connect();


    }


});





// Close Redis connection after tests

afterAll(async () => {


    await redisClient.quit();


});








test(
    "Fixed window should allow request inside limit",

    async () => {


        const key =
        "test:fixed";



        await redisClient.del(
            key
        );




        const result =
        await fixedWindow(

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
    "Fixed window should block request after limit exceeded",

    async () => {


        const key =
        "test:fixed:block";




        await redisClient.del(
            key
        );





        for(
            let i = 0;
            i < 5;
            i++
        ){


            await fixedWindow(

                key,

                5,

                60

            );


        }






        const result =
        await fixedWindow(

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