const positiveInteger = (env, name) => {
    const value = Number(env[name]);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }
    return value;
};

export const createConfig = (env = process.env) => ({
    forstesidegeneratorBaseUrl: env.FOERSTESIDEGENERATOR_BASE_URL,
    foerstesidegeneratorTimeoutMs: positiveInteger(env, "FOERSTESIDEGENERATOR_TIMEOUT_MS"),
    stsTokenUrl: env.STS_TOKEN_URL,
    stsTokenApiKey: env.STS_TOKEN_API_KEY,
    serviceUserUsername: env.SERVICEUSER_USERNAME,
    serviceUserPassword: env.SERVICEUSER_PASSWORD,
    foerstesidegeneratorApiKey: env.FOERSTESIDEGENERATOR_API_KEY,
    logLevel: env.PROXY_LOG_LEVEL || "info",
});

export default createConfig();
