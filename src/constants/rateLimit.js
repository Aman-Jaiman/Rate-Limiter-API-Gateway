// Available subscription plans and their request limits

const PLANS = {


    FREE:
    "free",



    PRO:
    "pro",



    ENTERPRISE:
    "enterprise"


};





const LIMITS = {


    [PLANS.FREE]:
    10,



    [PLANS.PRO]:
    100,



    [PLANS.ENTERPRISE]:
    1000


};





module.exports = {

    PLANS,

    LIMITS

};