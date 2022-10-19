const { createProxyMiddleware } = require('http-proxy-middleware');
const securityUtils = require('./securityUtils.js')
const config = require('./config');
const { stsTokenHandler, HEADER_STS_TOKEN } = require("./security/sts");
const { exstreamTokenHandler } = require("./security/exstreamAuth");

function setupProxy(app) {

    // Proxy endpoints
    app.use('/foersteside', securityUtils.authenticateToken, stsTokenHandler, createProxyMiddleware({
        target: config.forstesidegeneratorBaseUrl,
        changeOrigin: true,
        logLevel: 'warn',
        onProxyReq: (proxyReq => {
            proxyReq.setHeader('Authorization', `Bearer ${proxyReq.getHeader(HEADER_STS_TOKEN)}`);
            proxyReq.setHeader('x-nav-apiKey', config.foerstesidegeneratorApiKey);
            proxyReq.setHeader('Nav-Consumer-Id', config.serviceUserUsername);
        }),
        pathRewrite: {
            '^/': '/api/foerstesidegenerator/v1/', // add base path
        }
    }));
    app.use('/norg2', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.norg2BaseUrl,
        changeOrigin: true,
        logLevel: 'warn',
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));
    app.use('/oppdaterenhetsinfo', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.oppdaterenhetsinfoBaseUrl,
        changeOrigin: true,
        logLevel: 'warn',
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));
    app.use('/kodeverk', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.kodeverkUrl,
        changeOrigin: true,
        logLevel: 'warn',
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));

    app.use('/exstream', securityUtils.authenticateToken, exstreamTokenHandler, createProxyMiddleware({
        target: config.exstreamBaseUrl,
        changeOrigin: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq => {
            proxyReq.removeHeader('authorization');
            console.debug(JSON.stringify(proxyReq));
        }),
        pathRewrite: {
            '^/': '/v1/communications?name=exstream_rest_gateway&version=1', // add base path
        }
    }));
}



exports.setupProxy = setupProxy;
