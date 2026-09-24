const positiveInteger = (name) => {
    const value = Number(process.env[name]);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }
    return value;
};

const config = {
    forstesidegeneratorBaseUrl: process.env.FOERSTESIDEGENERATOR_BASE_URL,
    foerstesidegeneratorTimeoutMs: positiveInteger("FOERSTESIDEGENERATOR_TIMEOUT_MS"),
    stsTokenUrl: process.env.STS_TOKEN_URL,
    stsTokenApiKey: process.env.STS_TOKEN_API_KEY,
    serviceUserUsername: process.env.SERVICEUSER_USERNAME,
    serviceUserPassword: process.env.SERVICEUSER_PASSWORD,
    foerstesidegeneratorApiKey: process.env.FOERSTESIDEGENERATOR_API_KEY,
    logLevel: process.env.PROXY_LOG_LEVEL || "info",
}

module.exports = config;
