const config = {
    forstesidegeneratorBaseUrl: process.env.FOERSTESIDEGENERATOR_BASE_URL,
    norg2BaseUrl: process.env.NORG2_BASE_URL,
    norg2ConsumerId: process.env.NORG2_CONSUMER_ID,
    oppdaterenhetsinfoBaseUrl: process.env.OPPDATERENHETSINFO_BASE_URL,
    stsTokenUrl: process.env.STS_TOKEN_URL,
    stsTokenApiKey: process.env.STS_TOKEN_API_KEY,
    serviceUserUsername: process.env.SERVICEUSER_USERNAME,
    serviceUserPassword: process.env.SERVICEUSER_PASSWORD,
    foerstesidegeneratorApiKey: process.env.FOERSTESIDEGENERATOR_API_KEY,
    kodeverkUrl: process.env.KODEVERK_URL,
    exstreamBaseUrl: process.env.EXSTREAM_BASE_URL,
    exstreamUsername: process.env.EXSTREAM_USERNAME,
    exstreamPassword: process.env.EXSTREAM_PASSWORD,
    logLevel: process.env.PROXY_LOG_LEVEL || "info",
}

module.exports = config;
