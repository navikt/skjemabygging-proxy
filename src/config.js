const config = {
    forstesidegeneratorBaseUrl: process.env.FOERSTESIDEGENERATOR_BASE_URL,
    oppdaterenhetsinfoBaseUrl: process.env.OPPDATERENHETSINFO_BASE_URL,
    stsTokenUrl: process.env.STS_TOKEN_URL,
    stsTokenApiKey: process.env.STS_TOKEN_API_KEY,
    serviceUserUsername: process.env.SERVICEUSER_USERNAME,
    serviceUserPassword: process.env.SERVICEUSER_PASSWORD,
    foerstesidegeneratorApiKey: process.env.FOERSTESIDEGENERATOR_API_KEY,
    exstreamBaseUrl: process.env.EXSTREAM_BASE_URL,
    exstreamTicketBaseUrl: process.env.EXSTREAM_TICKET_BASE_URL,
    exstreamUsername: process.env.EXSTREAM_USERNAME,
    exstreamPassword: process.env.EXSTREAM_PASSWORD,
    logLevel: process.env.PROXY_LOG_LEVEL || "info",
}

module.exports = config;
