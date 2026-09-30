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

const configuredOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const isLocalDevelopmentOrigin = (origin) =>
    process.env.NODE_ENV !== "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);



// Add basic security headers

app.use(
    helmet()
);



// Allow frontend applications to access API

app.use(
    cors({
        origin: (origin, callback) => {
            if (
                !origin ||
                configuredOrigins.includes(origin) ||
                isLocalDevelopmentOrigin(origin)
            ) {
                return callback(null, true);
            }

            return callback(new Error("Origin is not allowed by CORS"));
        },
        exposedHeaders: [
            "Retry-After",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Window"
        ]
    })
);



// Parse JSON request body

app.use(
    express.json()
);



// Log incoming requests

app.use(
    logger
);


// Lightweight health check for deployment platforms
app.get(
    "/health",
    (req, res) => {
        res.json({
            status: "ok"
        });
    }
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