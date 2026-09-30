require("dotenv").config();


const app = require("./src/app");

const redisClient = require("./src/config/redis");

const connectDB = require("./src/config/db");



// Render supplies PORT; the fallback is for local development.
const PORT = process.env.PORT || 3001;



const startServer = async () => {


    try {


        // Connect MongoDB before starting server

        await connectDB();


        // Connect Redis before accepting requests

        await redisClient.connect();




        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Server running on port ${PORT}`
                );

            }
        );



    } catch (error) {


        // Stop application if required services fail

        console.error(
            "Server startup failed:",
            error.message
        );


        process.exit(1);


    }


};



// Start application

startServer();