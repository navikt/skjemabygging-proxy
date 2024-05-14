const {createProxyMiddleware} = require('http-proxy-middleware');
const securityUtils = require('./securityUtils.js');
const config = require('./config');
const {stsTokenHandler, HEADER_STS_TOKEN} = require("./security/sts");
const {exstreamTokenHandler} = require("./security/exstreamAuth");
const {logProxyResError} = require("./utils/http");

function setupProxy(app) {

    // Proxy endpoints
    app.use('/foersteside', securityUtils.authenticateToken, stsTokenHandler, createProxyMiddleware({
        target: config.forstesidegeneratorBaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
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
    app.use('/norg2', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.norg2BaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => {
            proxyReq.removeHeader('authorization');
            proxyReq.setHeader("consumerId", config.norg2ConsumerId);
        }),
        onProxyRes: logProxyResError,
    }));
    app.use('/oppdaterenhetsinfo', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.oppdaterenhetsinfoBaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
        onProxyRes: logProxyResError,
    }));
    app.use('/kodeverk', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.kodeverkUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
        onProxyRes: logProxyResError,
    }));

    app.use('/exstream', securityUtils.authenticateToken, exstreamTokenHandler, createProxyMiddleware({
        target: config.exstreamBaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
        onProxyRes: logProxyResError,
        pathRewrite: {
            '^/exstream': '/tenant1/sgw/v1/communications?name=ccm_service_html_to_pdf&version=1',
        }
    }));
}


exports.setupProxy = setupProxy;
