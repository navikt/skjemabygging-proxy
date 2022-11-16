const {logError} = require("./log");
const parseResponseBody = (res, contentType = "") => {
    return new Promise((resolve) => {
        try {
            const chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                const result = Buffer.concat(chunks).toString();
                resolve(contentType.includes("application/json") ? JSON.parse(result) : result);
            });
        } catch (e) {
            resolve(`Failed to parse response body: ${e.message}`);
        }
    });
}

const logProxyResError = async (proxyRes, req) => {
    if (proxyRes.statusCode >= 400) {
        const contentType = proxyRes.headers["content-type"];
        const proxyResponseBody = await parseResponseBody(proxyRes, contentType);
        const message = `Proxy response error${proxyResponseBody.message ? `: ${proxyResponseBody.message}` : ""}`;
        logError({message, httpStatus: proxyRes.statusCode, contentType, proxyResponseBody: JSON.stringify(proxyResponseBody), url: req.url});
    }
};

module.exports = {
    logProxyResError,
}
