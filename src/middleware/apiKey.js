const ApiKey =
require("../models/apiKey.model");


const AppError =
require("../errors/AppError");





const apiKeyAuth =
async (req, res, next) => {


    try {


        // Read API key from request header

        const key =
        req.headers["x-api-key"];




        if(!key){


            throw new AppError(
                "API Key Missing",
                401
            );


        }






        const user =
        await ApiKey.findOne({

            key

        });





        if(!user){


            throw new AppError(
                "Invalid API Key",
                403
            );


        }






        if(!user.active){


            throw new AppError(
                "API Key Disabled",
                403
            );


        }






        // Attach API key details for next middlewares

        req.user = {


            apiKey:
            user.key,


            plan:
            user.plan,


            limit:
            user.limit


        };






        next();



    } catch(error) {


        next(error);


    }


};





module.exports =
apiKeyAuth;