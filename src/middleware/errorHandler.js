const errorHandler =
(
    err,
    req,
    res,
    next
) => {


    // Convert thrown errors into consistent API responses

    const statusCode =
    err.statusCode || 500;





    res
    .status(statusCode)
    .json({


        success:
        false,


        message:
        err.message ||
        "Internal Server Error",



        stack:
        process.env.NODE_ENV === "development"
        ?
        err.stack
        :
        undefined


    });


};




module.exports =
errorHandler;