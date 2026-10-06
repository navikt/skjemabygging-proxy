import {describe, before, after, beforeEach, it} from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import {createFixtureServer, json} from "./fixtureServer.js";

describe("cover page proxy", () => {
    let introspection;
    let sts;
    let generator;
    let app;
    let clearStsToken;
    const token = jwt.sign({sub: "service"}, "test", {expiresIn: "1h"});

    before(async () => {
        [introspection, sts, generator] = await Promise.all([
            createFixtureServer(), createFixtureServer(), createFixtureServer(),
        ]);
        process.env.NODE_ENV = "test";
        process.env.NAIS_TOKEN_INTROSPECTION_ENDPOINT = `${introspection.url}/introspect`;
        process.env.STS_TOKEN_URL = `${sts.url}/rest/v1/sts/token`;
        process.env.FOERSTESIDEGENERATOR_BASE_URL = generator.url;
        process.env.PROXY_LOG_LEVEL = "warn";
        ({default: app} = await import("../src/server.js"));
        ({clearStsToken} = await import("../src/security/sts.js"));
    });

    after(async () => {
        await Promise.all([introspection, sts, generator].map(fixture => fixture?.close()));
    });

    beforeEach(() => {
        clearStsToken();
        introspection.respondWith((_request, response) => json(response, 200, {active: true}));
        sts.respondWith((_request, response) => json(response, 200, {access_token: token}));
        generator.respondWith((_request, response) => json(response, 200, {testObject: "12345"}));
    });

    const get = (path) => supertest(app).get(path).set("Authorization", "Bearer caller-token");

    it("forwards the cover page with the STS credentials and rewritten host", async () => {
        const response = await get("/foersteside").expect(200);
        assert.deepEqual(response.body, {testObject: "12345"});
        assert.equal(introspection.requests.length, 1);
        assert.equal(sts.requests.length, 1);
        assert.equal(generator.requests.length, 1);
        assert.deepEqual(generator.requests[0].method, "GET");
        assert.equal(generator.requests[0].url, "/api/foerstesidegenerator/v1/foersteside");
        assert.equal(generator.requests[0].body, "");
        assert.equal(generator.requests[0].headers.authorization, `Bearer ${token}`);
        assert.equal(generator.requests[0].headers["x-nav-apikey"], "foerstesidegeneratorapikey");
        assert.equal(generator.requests[0].headers["nav-consumer-id"], "serviceuser");
        assert.equal(generator.requests[0].headers.host, new URL(generator.url).host);
    });

    it("preserves the exact trailing slash, subpath and query string", async () => {
        for (const [incoming, outgoing] of [
            ["/foersteside/", "/api/foerstesidegenerator/v1/foersteside/"],
            ["/foersteside?name=one%20two", "/api/foerstesidegenerator/v1/foersteside?name=one%20two"],
            ["/foersteside/?name=one%20two", "/api/foerstesidegenerator/v1/foersteside/?name=one%20two"],
            ["/foersteside/sub/path?name=one%20two&name=three", "/api/foerstesidegenerator/v1/foersteside/sub/path?name=one%20two&name=three"],
        ]) {
            await get(incoming).expect(200);
            assert.equal(generator.requests.at(-1).url, outgoing);
        }
        assert.equal(generator.requests.length, 4);
    });

    it("forwards upstream 4xx and 5xx errors and logs all error body chunks", async (t) => {
        const warnings = [];
        const errors = [];
        t.mock.method(console, "warn", entry => warnings.push(JSON.parse(entry)));
        t.mock.method(console, "error", entry => errors.push(JSON.parse(entry)));
        generator.respondWith((request, response) => {
            const status = request.url.includes("client") ? 400 : 503;
            response.writeHead(status, {"content-type": "application/json"});
            response.write('{"message":"split ');
            response.end('downstream error"}');
        });
        for (const [path, status] of [["/foersteside/client", 400], ["/foersteside/server", 503]]) {
            const response = await get(path).expect(status);
            assert.deepEqual(response.body, {message: "split downstream error"});
            assert.equal(response.text, '{"message":"split downstream error"}');
        }
        assert.equal(generator.requests.length, 2);
        for (const [logs, status] of [[warnings, 400], [errors, 503]]) {
            const entry = logs.find(log => log.httpStatus === status);
            assert.equal(entry?.proxyResponseBody, '{"message":"split downstream error"}');
            assert.equal(entry?.url, `/api/foerstesidegenerator/v1/foersteside/${status === 400 ? "client" : "server"}`);
        }
    });

    it("handles an upstream connection failure and logs the failed response", async (t) => {
        const errors = [];
        t.mock.method(console, "error", entry => errors.push(JSON.parse(entry)));
        generator.respondWith((_request, _response, incoming) => incoming.socket.destroy());
        await get("/foersteside/disconnected").expect(504);
        assert.equal(generator.requests.length, 1);
        assert.ok(errors.some(entry => entry.message.includes("ECONNRESET") && entry.message.includes("/foersteside/disconnected")));
    });

    it("forwards malformed upstream error JSON and logs the parse failure", async (t) => {
        const warnings = [];
        t.mock.method(console, "warn", entry => warnings.push(JSON.parse(entry)));
        generator.respondWith((_request, response) => {
            response.writeHead(400, {"content-type": "application/json"});
            response.end("{broken response");
        });
        const response = await get("/foersteside/bad-json")
            .parse((upstream, done) => {
                const chunks = [];
                upstream.on("data", chunk => chunks.push(chunk));
                upstream.on("end", () => done(null, Buffer.concat(chunks).toString()));
            })
            .expect(400);
        assert.equal(response.body, "{broken response");
        assert.match(warnings.find(entry => entry.httpStatus === 400)?.proxyResponseBody, /Failed to parse response body/);
    });

    it("keeps liveness, readiness and Prometheus available without authentication", async () => {
        for (const path of ["/internal/health/liveness", "/internal/health/readiness"]) {
            const response = await supertest(app).get(path).expect(200);
            assert.deepEqual(response.body, {status: "UP"});
        }
        const metrics = await supertest(app).get("/internal/prometheus").expect(200);
        assert.match(metrics.text, /http_request_duration_seconds/);
        assert.equal(introspection.requests.length, 0);
        assert.equal(sts.requests.length, 0);
        assert.equal(generator.requests.length, 0);
    });
});
