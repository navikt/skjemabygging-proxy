const axios = require("axios");
const jwt = require("jsonwebtoken");
const correlator = require('express-correlation-id');
const config = require("../config");

const HEADER_STS_TOKEN = "StsToken";
const URL = config.stsTokenUrl + "?grant_type=client_credentials&scope=openid";

const logError = logObject => {
    const correlationId = correlator.getId();
    console.log(JSON.stringify({
        ...logObject,
        url: URL,
        correlation_id: correlationId
    }));
};

const fetchStsToken = async () => {
    const response = await axios.get(URL, {
        headers: { "x-nav-apiKey": config.stsTokenApiKey },
        auth: {
            username: config.serviceUserUsername,
            password: config.serviceUserPassword,
        },
        method: "GET",
    }).catch(err => {
        if (err.response) {
            logError({
                responseData: err.response.data,
                responseStatus: err.response.status,
            });
            throw new Error(`${err.response.status} ${err.response.statusText}`);
        }
        logError({
            message: err.message,
        });
        throw err;
    });
    return response.data.access_token;
}

let stsToken = undefined;

const isExpired = (token) => {
    const tokenExpiration = jwt.decode(token).exp;
    const currentTime = new Date().getTime() / 1000;
    return tokenExpiration - 10 < currentTime;
}

const getStsToken = async () => {
    if (!stsToken) {
        stsToken = await fetchStsToken();
    } else if (isExpired(stsToken)) {
        stsToken = await fetchStsToken();
    }
    return stsToken;
}

const stsTokenHandler = async (req, res, next) => {
    try {
        req.headers[HEADER_STS_TOKEN] = await getStsToken();
        next();
    } catch (error) {
        next(error);
    }
}

// for testing
const clearStsToken = () => {
    stsToken = undefined;
}

module.exports = {
    clearStsToken,
    getStsToken,
    stsTokenHandler,
    HEADER_STS_TOKEN
};
