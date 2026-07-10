// Common time conversion helpers


const currentTime =
() => {


    return Date.now();


};





const secondsToMs =
(seconds) => {


    return seconds * 1000;


};





const msToSeconds =
(ms) => {


    return Math.floor(
        ms / 1000
    );


};





module.exports = {

    currentTime,

    secondsToMs,

    msToSeconds

};