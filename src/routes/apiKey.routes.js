const express = require("express");


const router = express.Router();



const {

    generateApiKey,

    getApiKeys,

    getUsage,

    disableApiKey

} = require("../controllers/apiKey.controller");




// Generate a new API key

router.post(
    "/generate",
    generateApiKey
);




// Fetch all created API keys

router.get(
    "/",
    getApiKeys
);




// Get usage analytics for a specific API key

router.get(
    "/usage/:key",
    getUsage
);




// Disable an existing API key

router.patch(
    "/disable/:key",
    disableApiKey
);




module.exports = router;