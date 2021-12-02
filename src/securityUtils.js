const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const {HttpsProxyAgent} = require("https-proxy-agent");

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null){
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
            console.log("jwt verify failed:", err);
            return res.status(401).send({
                "timestamp": Date.now(),
                "status": 401,
                "error": "Unauthorized",
                "message": "Access Denied",
                "path": req.originalUrl
            });
        }
        next();
    });
}

let httpsProxy;
if (process.env.HTTPS_PROXY) {
    httpsProxy = new HttpsProxyAgent(process.env.HTTPS_PROXY);
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
