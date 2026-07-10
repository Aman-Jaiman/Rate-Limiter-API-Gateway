const express = require("express");

const cors = require("cors");

const helmet = require("helmet");



const logger =
require("./middleware/logger");


const routes =
require("./routes/index.routes");


const errorHandler =
require("./middleware/errorHandler");




const app = express();



// Add basic security headers

app.use(
    helmet()
);



// Allow frontend applications to access API

app.use(
    cors()
);



// Parse JSON request body

app.use(
    express.json()
);



// Log incoming requests

app.use(
    logger
);




// Register all API routes

app.use(
    "/api",
    routes
);




// Health check endpoint

app.get(
    "/",
    (req, res) => {


        res.json({

            success: true,

            message:
            "Rate Limiter API Running"

        });


    }
);




// Global error handler should always be last

app.use(
    errorHandler
);




module.exports = app;