const { createProxyMiddleware } = require('http-proxy-middleware');
const asyncHandler = require('express-async-handler');
const securityUtils = require('./securityUtils.js')
const config = require('./config');
const { getStsToken } = require("./security/sts");

function setupProxy(app) {
    let stsToken = undefined;
    app.use(['/foersteside'], asyncHandler(async (req, res, next) => {
        stsToken = await getStsToken();
        return next();
    }));

    // Proxy endpoints
    app.use('/foersteside', securityUtils.authenticateToken, createProxyMiddleware({
        target: config.forstesidegeneratorBaseUrl,
        changeOrigin: true,
        onProxyReq: (proxyReq => {
            proxyReq.setHeader('Authorization', `Bearer ${stsToken}`);
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
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));
}

exports.setupProxy = setupProxy;
