const crypto = require("crypto");


const ApiKey =
require("../models/apiKey.model");


const asyncHandler =
require("../utils/asyncHandler");


const AppError =
require("../errors/AppError");


const {

    LIMITS

} = require("../constants/rateLimit");





// Generate a new API key based on selected plan

const generateApiKey =
asyncHandler(async (req, res) => {


    const { plan } =
    req.body;



    const limit =
    LIMITS[plan];



    if(!limit){


        throw new AppError(
            "Invalid Plan",
            400
        );


    }





    const key =
    "rl_" +
    crypto
    .randomBytes(16)
    .toString("hex");





    const apiKey =
    await ApiKey.create({

        key,

        plan,

        limit

    });





    res
    .status(201)
    .json({


        success: true,


        data: {


            apiKey:
            apiKey.key,


            plan:
            apiKey.plan,


            limit:
            apiKey.limit


        }


    });


});







// Get all generated API keys

const getApiKeys =
asyncHandler(async (req, res) => {


    const keys =
    await ApiKey.find()
    .select("-__v");





    res.json({


        success: true,


        total:
        keys.length,


        data:
        keys


    });


});








// Get usage details of a single API key

const getUsage =
asyncHandler(async (req, res) => {


    const apiKey =
    await ApiKey.findOne({

        key:
        req.params.key

    });




    if(!apiKey){


        throw new AppError(
            "API Key Not Found",
            404
        );


    }





    res.json({


        success: true,


        usage:
        apiKey.usage


    });


});









// Disable an active API key

const disableApiKey =
asyncHandler(async (req, res) => {


    const apiKey =
    await ApiKey.findOneAndUpdate(

        {

            key:
            req.params.key

        },


        {

            active:false

        },


        {

            new:true

        }

    );





    if(!apiKey){


        throw new AppError(
            "API Key Not Found",
            404
        );


    }






    res.json({


        success:true,


        message:
        "API Key Disabled"


    });


});







module.exports = {

    generateApiKey,

    getApiKeys,

    getUsage,

    disableApiKey

};