import {logError, logWarn} from "./log.js";
const parseResponseBody = (res, contentType = "") => {
    return new Promise((resolve) => {
        const chunks = [];
        res.on("data", chunk => chunks.push(chunk));
        res.once("end", () => {
            const result = Buffer.concat(chunks).toString();
            try {
                resolve(contentType.includes("application/json") ? JSON.parse(result) : result);
            } catch (error) {
                resolve(`Failed to parse response body: ${error.message}`);
            }
        });
        res.once("error", error => resolve(`Failed to read response body: ${error.message}`));
        res.once("close", () => resolve("Upstream response closed before completion"));
    });
}

const logProxyResError = async (proxyRes, req) => {
    if (proxyRes.statusCode >= 400) {
        const contentType = proxyRes.headers["content-type"];
        const proxyResponseBody = await parseResponseBody(proxyRes, contentType);
        const message = `Proxy response error${proxyResponseBody.message ? `: ${proxyResponseBody.message}` : ""}`;
        const log = proxyRes.statusCode >= 500 ? logError : logWarn;
        log({message, httpStatus: proxyRes.statusCode, contentType, proxyResponseBody: JSON.stringify(proxyResponseBody), url: req.url});
    }
};

export {logProxyResError};
