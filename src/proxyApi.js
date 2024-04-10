import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken } from './securityUtils.js'
import config from './config';
import { stsTokenHandler, HEADER_STS_TOKEN } from "./security/sts"
import { exstreamTokenHandler } from "./security/exstreamAuth"


import { logProxyResError } from "./utils/http";

export function setupProxy(app) {

    // Proxy endpoints
    app.use('/foersteside', authenticateToken, stsTokenHandler, createProxyMiddleware({
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
    app.use('/norg2', authenticateToken, createProxyMiddleware({
        target: config.norg2BaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => {
            proxyReq.removeHeader('authorization');
            proxyReq.setHeader("consumerId", config.norg2ConsumerId);
        }),
        onProxyRes: logProxyResError,
    }));
    app.use('/oppdaterenhetsinfo', authenticateToken, createProxyMiddleware({
        target: config.oppdaterenhetsinfoBaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));
    app.use('/kodeverk', authenticateToken, createProxyMiddleware({
        target: config.kodeverkUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
    }));

    app.use('/exstream', authenticateToken, exstreamTokenHandler, createProxyMiddleware({
        target: config.exstreamBaseUrl,
        changeOrigin: true,
        logLevel: config.logLevel,
        onProxyReq: (proxyReq => proxyReq.removeHeader('authorization')),
        pathRewrite: {
            '^/exstream': '/tenant1/sgw/v1/communications?name=ccm_service_html_to_pdf&version=1',
        }
    }));
}
