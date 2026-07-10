const logger = (req, res, next) => {


    // Log basic information about incoming requests

    console.log(
        `${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
    );



    next();


};




module.exports = logger;