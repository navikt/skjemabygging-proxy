const { createProxyMiddleware } = require('http-proxy-middleware');
const securityUtils = require('./securityUtils.js')
const config = require('./config');
const { stsTokenHandler, HEADER_STS_TOKEN } = require("./security/sts");

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
}

exports.setupProxy = setupProxy;
