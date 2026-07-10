// Generate consistent Redis keys


const rateLimitKey =
(
    algorithm,
    apiKey
) => {


    return (
        `rate-limit:${algorithm}:${apiKey}`
    );


};





module.exports = {

    rateLimitKey

};