import {createProxyMiddleware} from "http-proxy-middleware";
import {format} from "node:util";
import {authenticateToken} from "./securityUtils.js";
import config from "./config.js";
import {stsTokenHandler, HEADER_STS_TOKEN} from "./security/sts.js";
import {logProxyResError} from "./utils/http.js";
import {logError} from "./utils/log.js";

function setupProxy(app) {

    // Proxy endpoints
    app.use('/foersteside', (req, _res, next) => {
        req.socket.setTimeout(config.foerstesidegeneratorTimeoutMs);
        req.once("end", () => req.socket.setTimeout(0));
        next();
    }, authenticateToken, stsTokenHandler, createProxyMiddleware({
        target: config.forstesidegeneratorBaseUrl,
        changeOrigin: true,
        logger: {
            info: () => {},
            warn: () => {},
            error: (...args) => logError({message: format(...args)}),
        },
        proxyTimeout: config.foerstesidegeneratorTimeoutMs,
        on: {
            proxyReq: (proxyReq, _req) => {
                proxyReq.setHeader('Authorization', `Bearer ${proxyReq.getHeader(HEADER_STS_TOKEN)}`);
                proxyReq.setHeader('x-nav-apiKey', config.foerstesidegeneratorApiKey);
                proxyReq.setHeader('Nav-Consumer-Id', config.serviceUserUsername);
            },
            proxyRes: logProxyResError,
        },
        pathRewrite: (_path, req) => `/api/foerstesidegenerator/v1${req.originalUrl}`,
    }));

}


export {setupProxy};
