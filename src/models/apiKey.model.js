const mongoose = require("mongoose");




// Store API key details and usage analytics

const apiKeySchema =
new mongoose.Schema(

{

    key: {

        type: String,

        required: true,

        unique: true,

        index: true

    },



    plan: {

        type: String,

        required: true,

        enum: [
            "free",
            "pro",
            "enterprise"
        ]

    },



    limit: {

        type: Number,

        required: true

    },



    active: {

        type: Boolean,

        default: true

    },



    usage: {


        totalRequests: {

            type: Number,

            default: 0

        },



        blockedRequests: {

            type: Number,

            default: 0

        },



        lastUsed: {

            type: Date

        }


    }


},

{

    timestamps: true

}

);





module.exports =
mongoose.model(

    "ApiKey",

    apiKeySchema

);