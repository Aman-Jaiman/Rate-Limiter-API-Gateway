const asyncHandler =
require("../utils/asyncHandler");


const RequestLog =
require("../models/requestLog.model");


const {

    getRedisStats

} = require("../services/redis.service");




// Get Redis server information

const redisStats =
asyncHandler(async (req, res) => {


    const stats =
    await getRedisStats();



    res.json({

        success: true,

        data: stats

    });


});




// Get latest request logs

const getLogs =
asyncHandler(async (req, res) => {


    const logs =
    await RequestLog.find()
    .sort({

        createdAt: -1

    })
    .limit(50);



    res.json({

        success: true,

        total: logs.length,

        data: logs

    });


});





module.exports = {

    redisStats,

    getLogs

};