const axios = require("axios");
const config = require("../config");
const jwt = require("jsonwebtoken");

const HEADER_STS_TOKEN = "StsToken";

const fetchStsToken = async () => {
    const response = await axios.get(config.stsTokenUrl + "?grant_type=client_credentials&scope=openid", {
        headers: { "x-nav-apiKey": config.stsTokenApiKey },
        auth: {
            username: config.serviceUserUsername,
            password: config.serviceUserPassword,
        },
        method: "GET",
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
    req.headers[HEADER_STS_TOKEN] = await getStsToken();
    next();
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