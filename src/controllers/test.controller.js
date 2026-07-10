const testAPI = (req, res) => {


    res
    .status(200)
    .json({

        success: true,

        message:
        "Rate Limiter Test API"

    });


};




module.exports = {

    testAPI

};