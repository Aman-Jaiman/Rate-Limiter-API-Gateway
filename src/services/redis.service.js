const redisClient =
require("../config/redis");




// Get Redis server statistics

const getRedisStats =
async () => {


    const info =
    await redisClient.info();




    const keys =
    await redisClient.dbSize();




    const memoryLine =
    info
    .split("\n")
    .find(

        line =>

        line.startsWith(
            "used_memory_human"
        )

    );





    const memory =
    memoryLine
    ?
    memoryLine
    .split(":")[1]
    .trim()
    :
    "Unknown";





    return {


        connected:
        redisClient.isReady,



        keys,



        memory


    };


};





module.exports = {

    getRedisStats

};