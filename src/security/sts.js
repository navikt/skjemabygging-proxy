import axios from "axios";
import jwt from "jsonwebtoken";
import config from "../config";

const HEADER_STS_TOKEN = "StsToken";
const URL = config.stsTokenUrl + "?grant_type=client_credentials&scope=openid";
import { logError } from "../utils/log";

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
                url: URL,
            });
            throw new Error(`${err.response.status} ${err.response.statusText}`);
        }
        logError({
            message: err.message,
            url: URL,
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

export {
    clearStsToken,
    getStsToken,
    stsTokenHandler,
    HEADER_STS_TOKEN
};
