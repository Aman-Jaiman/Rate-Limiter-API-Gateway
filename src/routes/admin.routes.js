const express = require("express");


const router = express.Router();



const {

    redisStats,

    getLogs

} = require("../controllers/admin.controller");




// Get Redis health and stats

router.get(
    "/redis",
    redisStats
);



// Get latest API request logs

router.get(
    "/logs",
    getLogs
);




module.exports = router;