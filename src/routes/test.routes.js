const express = require("express");


const router = express.Router();



const apiKeyAuth =
require("../middleware/apiKey");


const rateLimiter =
require("../middleware/rateLimiter");



const {

    testAPI

} = require("../controllers/test.controller");




// Protected route to test rate limiter

router.get(
    "/",

    apiKeyAuth,

    rateLimiter,

    testAPI
);




module.exports = router;