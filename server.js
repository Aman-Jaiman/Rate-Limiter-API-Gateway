require("dotenv").config();


const app = require("./src/app");

const redisClient = require("./src/config/redis");

const connectDB = require("./src/config/db");



// Use environment PORT or fallback for local development

const PORT = process.env.PORT || 3000;



const startServer = async () => {


    try {


        // Connect MongoDB before starting server

        await connectDB();



        // Connect Redis before accepting requests

        await redisClient.connect();




        app.listen(
            PORT,
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