const jwt = require("jsonwebtoken");
const config = require("../config");

const HEADER_STS_TOKEN = "StsToken";
const {logError} = require("../utils/log");

const authorization = `Basic ${Buffer.from(
    `${config.serviceUserUsername || ""}:${config.serviceUserPassword || ""}`, "utf8"
).toString("base64")}`;

const redact = (text) => {
    for (const secret of [authorization, config.stsTokenApiKey, config.serviceUserPassword, config.serviceUserUsername]) {
        if (secret) text = text.replaceAll(secret, "[REDACTED]");
    }
    return text;
};

const readResponse = async (response) => {
    try {
        return await response.text();
    } catch (error) {
        logError({message: "Could not read STS response", responseStatus: response.status, cause: redact(error.message)});
        throw new Error(`Could not read STS response (${response.status})`, {cause: error});
    }
};

const fetchStsToken = async () => {
    let stsUrl;
    try {
        stsUrl = new URL(config.stsTokenUrl);
    } catch (error) {
        logError({message: "Invalid STS token URL"});
        throw new Error("Invalid STS token URL", {cause: error});
    }
    stsUrl.searchParams.set("grant_type", "client_credentials");
    stsUrl.searchParams.set("scope", "openid");
    const endpoint = `${stsUrl.origin}${stsUrl.pathname}`;
    let response;
    try {
        response = await fetch(stsUrl, {
            method: "GET",
            headers: {
                "x-nav-apiKey": config.stsTokenApiKey,
                Authorization: authorization,
            },
        });
    } catch (error) {
        const message = redact(error.message);
        const cause = error.cause?.message && redact(error.cause.message);
        logError({message, cause, code: error.cause?.code, url: endpoint});
        throw new Error(`STS token request failed: ${message}${cause ? `: ${cause}` : ""}`, {cause: error});
    }

    const body = await readResponse(response);
    if (!response.ok) {
        let responseData;
        try {
            responseData = JSON.parse(redact(body));
        } catch {
            responseData = redact(body);
        }
        logError({responseData, responseStatus: response.status, url: endpoint});
        throw new Error(`STS token request failed: ${response.status} ${response.statusText}`);
    }

    let tokenResponse;
    try {
        tokenResponse = JSON.parse(body);
    } catch (error) {
        logError({message: "STS response is not valid JSON", responseStatus: response.status, url: endpoint});
        throw new Error("STS response is not valid JSON", {cause: error});
    }
    const token = tokenResponse?.access_token;
    if (typeof token !== "string" || !Number.isFinite(jwt.decode(token)?.exp)) {
        logError({message: "STS response has no valid access_token", responseStatus: response.status, url: endpoint});
        throw new Error("STS response has no valid access_token");
    }
    return token;
}

let stsToken = undefined;

const isExpired = (token) => {
    const tokenExpiration = jwt.decode(token)?.exp;
    const currentTime = new Date().getTime() / 1000;
    return !Number.isFinite(tokenExpiration) || tokenExpiration - 10 < currentTime;
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
