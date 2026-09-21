const https = require('https');
const {legacyCreateProxyMiddleware} = require('http-proxy-middleware');
const securityUtils = require('./securityUtils.js');
const config = require('./config');
const {stsTokenHandler, HEADER_STS_TOKEN} = require("./security/sts");
const {logProxyResError} = require("./utils/http");

// The on-prem firewall in front of *.intern.nav.no / *.fss-pub.nais.io drops idle
// connections after 60 minutes without a TCP close, which can surface as ECONNRESET /
// timeout errors if a keep-alive socket is reused past that point. Following the
// nais-recommended pattern (https://docs.nais.io/workloads/how-to/gcp-fss-communication/),
// keep the agent's connection TTL safely below the firewall's idle timeout.
const FOERSTESIDEGENERATOR_KEEP_ALIVE_MS = 55 * 60 * 1000; // 55 minutes
const FOERSTESIDEGENERATOR_REQUEST_TIMEOUT_MS = 30 * 1000; // max time to wait for a response

const foerstesidegeneratorAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: FOERSTESIDEGENERATOR_KEEP_ALIVE_MS,
    timeout: FOERSTESIDEGENERATOR_KEEP_ALIVE_MS,
    maxSockets: 200,
    maxFreeSockets: 20,
});

function setupProxy(app) {

    // Proxy endpoints
    app.use('/foersteside', securityUtils.authenticateToken, stsTokenHandler, legacyCreateProxyMiddleware({
        target: config.forstesidegeneratorBaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        agent: foerstesidegeneratorAgent,
        proxyTimeout: FOERSTESIDEGENERATOR_REQUEST_TIMEOUT_MS,
        onProxyReq: (proxyReq => {
            proxyReq.setHeader('Authorization', `Bearer ${proxyReq.getHeader(HEADER_STS_TOKEN)}`);
            proxyReq.setHeader('x-nav-apiKey', config.foerstesidegeneratorApiKey);
            proxyReq.setHeader('Nav-Consumer-Id', config.serviceUserUsername);
        }),
        onProxyRes: logProxyResError,
        pathRewrite: {
            '^/': '/api/foerstesidegenerator/v1/', // add base path
        }
    }));

}


exports.setupProxy = setupProxy;
