const fixedWindow =
require("../services/limiter/fixedWindow");


const slidingLog =
require("../services/limiter/slidingLog");


const slidingWindow =
require("../services/limiter/slidingWindow");


const tokenBucket =
require("../services/limiter/tokenBucket");


const leakyBucket =
require("../services/limiter/leakyBucket");



const config =
require("../config/rateLimit.config");


const AppError =
require("../errors/AppError");



const {

    rateLimitKey

} = require("../utils/redisKeys");



const {

    trackRequest

} = require("../services/analytics.service");



const {

    saveRequestLog

} = require("../services/log.service");








const rateLimiter =
async (req, res, next) => {


    try {


        const algorithm =
        config.algorithm;




        const key =
        rateLimitKey(

            algorithm,

            req.user.apiKey

        );




        let result;




        // Execute selected rate limiting algorithm

        if(
            algorithm === "fixed"
        ){


            result =
            await fixedWindow(

                key,

                req.user.limit,

                config.window

            );


        }




        else if(
            algorithm === "sliding-log"
        ){


            result =
            await slidingLog(

                key,

                req.user.limit,

                config.window

            );


        }





        else if(
            algorithm === "sliding-window"
        ){


            result =
            await slidingWindow(

                key,

                req.user.limit,

                config.window

            );


        }





        else if(
            algorithm === "token"
        ){


            result =
            await tokenBucket(

                key,

                req.user.limit,

                config.refillRate

            );


        }





        else if(
            algorithm === "leaky"
        ){


            result =
            await leakyBucket(

                key,

                req.user.limit,

                config.leakRate

            );


        }




        else{


            throw new AppError(
                "Invalid rate limiter algorithm",
                500
            );


        }








        res.set(
            "X-RateLimit-Limit",
            result.limit || req.user.limit
        );

        if(result.remaining !== undefined){

            res.set(
                "X-RateLimit-Remaining",
                result.remaining
            );

        }

        if(
            ["fixed", "sliding-log", "sliding-window"].includes(algorithm)
        ){

            res.set(
                "X-RateLimit-Window",
                config.window
            );

        }

        if(result.retryAfter > 0){

            res.set(
                "Retry-After",
                result.retryAfter
            );

        }

        // Store analytics and reject request when limit exceeds

        if(!result.allowed){



            await trackRequest(

                req.user.apiKey,

                true

            );





            await saveRequestLog({


                apiKey:
                req.user.apiKey,


                method:
                req.method,


                endpoint:
                req.originalUrl,


                allowed:
                false,


                statusCode:
                429,


                ip:
                req.ip


            });






            return res
            .status(429)
            .json({


                success:false,


                algorithm,


                message:
                "Too Many Requests"


            });


        }








        // Store successful request analytics

        await trackRequest(

            req.user.apiKey,

            false

        );






        await saveRequestLog({


            apiKey:
            req.user.apiKey,


            method:
            req.method,


            endpoint:
            req.originalUrl,


            allowed:
            true,


            statusCode:
            200,


            ip:
            req.ip


        });





        next();





    } catch(error) {


        next(error);


    }


};






module.exports =
rateLimiter;