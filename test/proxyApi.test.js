import {describe, before, after, it} from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import {createFixtureServer, json} from "./fixtureServer.js";

describe("proxy timeouts", () => {
    const timeoutMs = 100;
    let sts;
    let generator;
    let app;

    before(async () => {
        [sts, generator] = await Promise.all([createFixtureServer(), createFixtureServer()]);
        process.env.NODE_ENV = "development";
        process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = String(timeoutMs);
        process.env.STS_TOKEN_URL = `${sts.url}/rest/v1/sts/token`;
        process.env.FOERSTESIDEGENERATOR_BASE_URL = generator.url;
        ({default: app} = await import("../src/server.js"));
        sts.respondWith((_request, response) => json(response, 200, {
            access_token: jwt.sign({sub: "service"}, "test", {expiresIn: "1h"}),
        }));
    });

    after(async () => {
        await Promise.all([sts, generator].map(fixture => fixture?.close()));
    });

    it("stops waiting for a stalled upstream response at proxyTimeout", async () => {
        generator.respondWith(() => {});
        const start = performance.now();
        const response = await supertest(app).get("/foersteside/stalled").timeout(3000);
        assert.equal(response.status, 504);
        assert.ok(performance.now() - start >= timeoutMs - 15);
        assert.equal(generator.requests.length, 1);
    });

    it("closes an idle incoming request at timeout", async () => {
        generator.respondWith(() => {});
        const server = app.listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        try {
            const start = performance.now();
            await assert.rejects(new Promise((resolve, reject) => {
                const request = http.request({
                    host: "127.0.0.1",
                    port: server.address().port,
                    path: "/foersteside/slow-upload",
                    method: "POST",
                    headers: {"content-length": "10"},
                }, resolve);
                request.on("error", reject);
                request.write("partial");
            }), error => {
                assert.equal(error.code, "ECONNRESET", error.message);
                return true;
            });
            assert.ok(performance.now() - start >= timeoutMs - 15);
        } finally {
            server.closeAllConnections();
            await new Promise(resolve => server.close(resolve));
        }
    });

    it("does not accumulate timeout listeners on a reused client connection", async () => {
        generator.respondWith((_request, response) => json(response, 200, {ok: true}));
        const server = app.listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const agent = new http.Agent({keepAlive: true, maxSockets: 1});
        const sockets = new Set();
        server.on("connection", socket => sockets.add(socket));
        try {
            let timeoutListeners;
            for (let index = 0; index < 15; index++) {
                await new Promise((resolve, reject) => {
                    http.get({
                        host: "127.0.0.1",
                        port: server.address().port,
                        path: "/foersteside/reused",
                        agent,
                    }, response => {
                        response.resume();
                        response.on("end", resolve);
                        response.on("error", reject);
                    }).on("error", reject);
                });
                assert.equal(sockets.size, 1);
                const count = [...sockets][0].listenerCount("timeout");
                timeoutListeners ??= count;
                assert.equal(count, timeoutListeners);
            }
        } finally {
            agent.destroy();
            server.closeAllConnections();
            await new Promise(resolve => server.close(resolve));
        }
    });
});
