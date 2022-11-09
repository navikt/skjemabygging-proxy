const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const {HttpsProxyAgent} = require("https-proxy-agent");
const {logDebug, logInfo} = require("./utils/log");

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (process.env.NODE_ENV === 'development') {
        logDebug("Skipping token authentication in development");
        next();
    } else {
        if (token == null){
            logInfo({message: "Token missing", url: req.originalUrl});
            return res.status(403).send({
                "timestamp": Date.now(),
                "status": 403,
                "error": "Forbidden",
                "message": "Access Denied",
                "path": req.originalUrl
            })
        }

        jwt.verify(token, getKey, {
            algorithms:["RS256"],
            audience: process.env.AZURE_APP_CLIENT_ID,
            issuer: process.env.AZURE_OPENID_CONFIG_ISSUER
        }, function(err, decoded) {
            if (err) {
                logInfo({message: "JWT verify failed", url: req.originalUrl, err});
                return res.status(401).send({
                    "timestamp": Date.now(),
                    "status": 401,
                    "error": "Unauthorized",
                    "message": "Access Denied",
                    "path": req.originalUrl
                });
            }
            logDebug({message: "JWT verify succeeded", url: req.originalUrl, decodedJwt: decoded});
            next();
        });
    }
}

let httpsProxy;
if (process.env.HTTPS_PROXY) {
    logDebug({message: "Configuring proxy", httpsProxy: process.env.HTTPS_PROXY});
    httpsProxy = new HttpsProxyAgent(process.env.HTTPS_PROXY);
} else {
    logDebug({message: "No proxy will be configured"});
}

var client = jwksClient({
    jwksUri: process.env.AZURE_OPENID_CONFIG_JWKS_URI,
    requestAgent: httpsProxy,
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function(err, key) {
        if (err) {
            callback(err);
        } else {
            var signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        }
    });
}

exports.authenticateToken = authenticateToken;
