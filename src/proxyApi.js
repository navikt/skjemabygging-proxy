const { createProxyMiddleware } = require('http-proxy-middleware');
const securityUtils = require('./securityUtils.js')

function setupProxy(app) {
    // Proxy endpoints
    app.use('/norg2', securityUtils.authenticateToken, createProxyMiddleware({
        target: process.env.NNNORG2_BASE_URL,
        changeOrigin: true,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));
}

exports.setupProxy = setupProxy;
