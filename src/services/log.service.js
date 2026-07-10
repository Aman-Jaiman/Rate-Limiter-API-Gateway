const RequestLog =
require("../models/requestLog.model");




// Save API request details

const saveRequestLog =
async (data) => {


    await RequestLog.create(

        data

    );


};





module.exports = {

    saveRequestLog

};