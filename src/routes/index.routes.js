const express = require("express");


const router = express.Router();



const testRoutes =
require("./test.routes");


const apiKeyRoutes =
require("./apiKey.routes");


const adminRoutes =
require("./admin.routes");




// Combine all application routes

router.use(
    "/test",
    testRoutes
);



router.use(
    "/keys",
    apiKeyRoutes
);



router.use(
    "/admin",
    adminRoutes
);




module.exports = router;