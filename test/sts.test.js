import {describe, before, after, beforeEach, it} from "node:test";
import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import http from "node:http";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import jwt from "jsonwebtoken";
import {createFixtureServer, json} from "./fixtureServer.js";
const execFileAsync = promisify(execFile);

describe("STS token", () => {
    let sts;
    let getStsToken;
    let clearStsToken;

    before(async () => {
        sts = await createFixtureServer();
        process.env.STS_TOKEN_URL = `${sts.url}/rest/v1/sts/token?tenant=existing%20value&scope=other`;
        ({getStsToken, clearStsToken} = await import("../src/security/sts.js"));
    });

    after(async () => sts?.close());
    beforeEach(() => clearStsToken());

    const createToken = (sub, expiresIn) => jwt.sign({sub}, "test", {expiresIn});
    const captureErrors = (t) => {
        const logs = [];
        t.mock.method(console, "error", entry => logs.push(JSON.parse(entry)));
        return logs;
    };

    it("sends client credentials, scope, API key and Basic authentication, then caches the token", async () => {
        const token = createToken("first", "1h");
        sts.respondWith((_request, response) => json(response, 200, {access_token: token}));
        assert.equal(await getStsToken(), token);
        assert.equal(await getStsToken(), token);
        assert.equal(sts.requests.length, 1);
        assert.equal(sts.requests[0].method, "GET");
        assert.equal(sts.requests[0].url, "/rest/v1/sts/token?tenant=existing+value&scope=openid&grant_type=client_credentials");
        assert.equal(sts.requests[0].body, "");
        assert.equal(sts.requests[0].headers["x-nav-apikey"], "ststokenapikey");
        assert.equal(sts.requests[0].headers.authorization, `Basic ${Buffer.from("serviceuser:servicepass").toString("base64")}`);
    });

    it("renews a token that expires within ten seconds", async () => {
        const first = createToken("first", "9s");
        const second = createToken("second", "1h");
        let calls = 0;
        sts.respondWith((_request, response) => json(response, 200, {
            access_token: ++calls === 1 ? first : second,
        }));
        assert.equal(await getStsToken(), first);
        assert.equal(await getStsToken(), second);
        assert.equal(await getStsToken(), second);
        assert.equal(sts.requests.length, 2);
    });

    for (const status of [400, 503]) it(`logs HTTP ${status} response details and retries instead of caching an error`, async (t) => {
        const logs = captureErrors(t);
        const token = createToken("recovered", "1h");
        let calls = 0;
        sts.respondWith((request, response) => {
            if (++calls === 1) return json(response, status, {
                error: "unavailable",
                echoedAuthorization: request.headers.authorization,
                echoedApiKey: request.headers["x-nav-apikey"],
            });
            json(response, 200, {access_token: token});
        });
        await assert.rejects(getStsToken(), new RegExp(`${status}`));
        assert.equal(logs[0].responseStatus, status);
        assert.deepEqual(logs[0].responseData, {
            error: "unavailable",
            echoedAuthorization: "[REDACTED]",
            echoedApiKey: "[REDACTED]",
        });
        assert.ok(!JSON.stringify(logs).includes("servicepass"));
        assert.ok(!JSON.stringify(logs).includes("ststokenapikey"));
        assert.ok(!JSON.stringify(logs).includes(sts.requests[0].headers.authorization));
        assert.equal(await getStsToken(), token);
        assert.equal(sts.requests.length, 2);
    });

    it("reports non-JSON HTTP errors with the status and original body", async (t) => {
        const logs = captureErrors(t);
        sts.respondWith((_request, response) => {
            response.writeHead(502, {"content-type": "application/json"});
            response.end("{broken response");
        });
        await assert.rejects(getStsToken(), /502/);
        assert.equal(logs[0].responseStatus, 502);
        assert.equal(logs[0].responseData, "{broken response");
    });

    it("rejects an HTTP 304 response even when it has no body", async (t) => {
        const logs = captureErrors(t);
        sts.respondWith((_request, response) => response.writeHead(304).end());
        await assert.rejects(getStsToken(), /304/);
        assert.equal(logs[0].responseStatus, 304);
        assert.equal(logs[0].responseData, "");
    });

    it("rejects malformed success JSON without caching it", async (t) => {
        const logs = captureErrors(t);
        const token = createToken("recovered", "1h");
        let calls = 0;
        sts.respondWith((_request, response) => {
            if (++calls === 1) {
                response.writeHead(200, {"content-type": "application/json"});
                return response.end("{broken response");
            }
            json(response, 200, {access_token: token});
        });
        await assert.rejects(getStsToken(), /STS response is not valid JSON/);
        assert.equal(logs[0].responseStatus, 200);
        assert.equal(await getStsToken(), token);
        assert.equal(sts.requests.length, 2);
    });

    it("rejects a successful response with an empty body", async (t) => {
        const logs = captureErrors(t);
        sts.respondWith((_request, response) => response.writeHead(204).end());
        await assert.rejects(getStsToken(), /STS response is not valid JSON/);
        assert.equal(logs[0].responseStatus, 204);
    });

    for (const body of [{}, {access_token: 42}, {access_token: ""}, null]) {
        it(`rejects a successful response without a string access_token: ${JSON.stringify(body)}`, async (t) => {
            const logs = captureErrors(t);
            sts.respondWith((_request, response) => json(response, 200, body));
            await assert.rejects(getStsToken(), /STS response has no valid access_token/);
            assert.equal(logs[0].responseStatus, 200);
        });
    }

    for (const invalidToken of ["not-a-jwt", jwt.sign({sub: "no-exp"}, "test")]) {
        it("rejects a token without a valid expiration and retries", async (t) => {
            const logs = captureErrors(t);
            const validToken = createToken("recovered", "1h");
            let calls = 0;
            sts.respondWith((_request, response) => json(response, 200, {
                access_token: ++calls === 1 ? invalidToken : validToken,
            }));
            await assert.rejects(getStsToken(), /STS response has no valid access_token/);
            assert.equal(logs[0].responseStatus, 200);
            assert.equal(await getStsToken(), validToken);
            assert.equal(sts.requests.length, 2);
        });
    }

    it("logs network failures and passes a controlled error through the handler", async (t) => {
        const logs = captureErrors(t);
        sts.respondWith((_request, response) => response.destroy());
        const {stsTokenHandler} = await import("../src/security/sts.js");
        const request = {headers: {}};
        let forwardedError;
        await stsTokenHandler(request, {}, error => { forwardedError = error; });
        assert.match(forwardedError.message, /STS token request failed/);
        assert.ok(forwardedError.cause);
        assert.equal(request.headers.StsToken, undefined);
        assert.equal(sts.requests.length, 1);
        assert.match(logs[0].message, /fetch failed/);
        assert.ok(logs[0].cause);
        assert.ok(!JSON.stringify(logs).includes("servicepass"));
    });

    it("reports a refused connection without contacting an external server", async (t) => {
        const logs = captureErrors(t);
        const offline = await createFixtureServer();
        await offline.close();
        const {default: config} = await import("../src/config.js");
        const previousUrl = config.stsTokenUrl;
        config.stsTokenUrl = `${offline.url}/rest/v1/sts/token`;
        t.after(() => { config.stsTokenUrl = previousUrl; });
        await assert.rejects(getStsToken(), error => {
            assert.equal(error.cause?.cause?.code, "ECONNREFUSED");
            return true;
        });
        assert.equal(logs[0].code, "ECONNREFUSED");
        assert.match(logs[0].cause, /ECONNREFUSED/);
    });

    it("uses the configured environment proxy for the STS request", async () => {
        let proxiedPath;
        const token = createToken("proxy", "1h");
        const sockets = new Set();
        const proxy = http.createServer((request, response) => {
            proxiedPath = request.url;
            json(response, 200, {access_token: token});
        });
        proxy.on("connection", socket => {
            sockets.add(socket);
            socket.on("close", () => sockets.delete(socket));
        });
        proxy.on("connect", (request, socket) => {
            socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
            socket.once("data", data => {
                proxiedPath = data.toString().split("\r\n", 1)[0];
                const body = JSON.stringify({access_token: token});
                socket.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
            });
        });
        await new Promise(resolve => proxy.listen(0, "127.0.0.1", resolve));
        const offline = await createFixtureServer();
        await offline.close();
        try {
            const {stdout} = await execFileAsync(process.execPath, [
                "--env-file=test/test.env",
                "-e",
                'import("./src/security/sts.js").then(({getStsToken}) => getStsToken()).then(console.log)',
            ], {
                cwd: fileURLToPath(new URL("..", import.meta.url)),
                env: {
                    ...process.env,
                    STS_TOKEN_URL: `${offline.url}/rest/v1/sts/token`,
                    NODE_USE_ENV_PROXY: "1",
                    HTTP_PROXY: `http://127.0.0.1:${proxy.address().port}`,
                    http_proxy: `http://127.0.0.1:${proxy.address().port}`,
                    NO_PROXY: "",
                    no_proxy: "",
                },
                timeout: 5000,
            });
            assert.equal(stdout.trim(), token);
            assert.match(proxiedPath, /rest\/v1\/sts\/token\?grant_type=client_credentials&scope=openid/);
        } finally {
            for (const socket of sockets) socket.destroy();
            await new Promise(resolve => proxy.close(resolve));
        }
    });
});
