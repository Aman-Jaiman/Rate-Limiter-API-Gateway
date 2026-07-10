const ApiKey =
require("../models/apiKey.model");




// Update API usage analytics

const trackRequest =
async (
    key,
    blocked = false
) => {


    const update = {


        $inc: {

            "usage.totalRequests":
            1

        },



        $set: {

            "usage.lastUsed":
            new Date()

        }


    };





    if(blocked){


        update.$inc[
            "usage.blockedRequests"
        ] = 1;


    }





    await ApiKey.updateOne(

        {

            key

        },

        update

    );


};





module.exports = {

    trackRequest

};