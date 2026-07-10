const mongoose = require("mongoose");




// Store every API request history

const requestLogSchema =
new mongoose.Schema(

{

    apiKey: {

        type: String,

        required: true,

        index: true

    },



    method: {

        type: String,

        enum: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ]

    },



    endpoint: {

        type: String

    },



    allowed: {

        type: Boolean,

        default: true

    },



    statusCode: {

        type: Number

    },



    ip: {

        type: String

    }


},

{

    timestamps: true

}

);




// Faster search for latest logs

requestLogSchema.index({

    createdAt: -1

});





module.exports =
mongoose.model(

    "RequestLog",

    requestLogSchema

);