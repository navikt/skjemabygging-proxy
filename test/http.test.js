import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {PassThrough} from "node:stream";

process.env.PROXY_LOG_LEVEL = "warn";
const {logProxyResError} = await import("../src/utils/http.js");

describe("proxy response logging", () => {
    for (const [status, method] of [[400, "warn"], [500, "error"]]) {
        it(`logs downstream ${status} responses with the complete body`, async (t) => {
            const logs = [];
            t.mock.method(console, method, value => logs.push(JSON.parse(value)));
            const response = new PassThrough();
            response.statusCode = status;
            response.headers = {"content-type": "application/json"};
            const logging = logProxyResError(response, {url: "/foersteside"});
            response.write('{"message":"split ');
            response.end('downstream error"}');
            await logging;
            assert.equal(logs.length, 1);
            assert.equal(logs[0].httpStatus, status);
            assert.equal(logs[0].url, "/foersteside");
            assert.equal(logs[0].proxyResponseBody, '{"message":"split downstream error"}');
        });
    }
});
