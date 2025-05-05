const {logDebug, logInfo, logError} = require("./utils/log");

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (process.env.NODE_ENV === 'development') {
        logDebug("Skipping token authentication in development");
        next();
    } else {
        if (token == null) {
            logInfo({message: "Token missing", url: req.originalUrl});
            return res.status(403).send({
                "timestamp": Date.now(),
                "status": 403,
                "error": "Forbidden",
                "message": "Access Denied",
                "path": req.originalUrl
            })
        }

        const response = await fetch(process.env.NAIS_TOKEN_INTROSPECTION_ENDPOINT, {
            body: JSON.stringify({
                identity_provider: 'azuread',
                token,
            }),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            logInfo({message: "Token introspection failed", originalUrl: req.originalUrl, httpStatus: response.status, responseBody: await response.text()});
            return next(new Error("Token introspection failed"));
        }

        const validatedToken = await response.json();
        if (!validatedToken.active) {
            logInfo({message: `Token is not valid: ${validatedToken.error}`, url: req.originalUrl});
            return res.status(401).send({
                "timestamp": Date.now(),
                "status": 401,
                "error": "Unauthorized",
                "message": "Access Denied",
                "path": req.originalUrl
            });
        }

        logDebug({message: "JWT verify succeeded", url: req.originalUrl});
        next();
    }
}

exports.authenticateToken = authenticateToken;
