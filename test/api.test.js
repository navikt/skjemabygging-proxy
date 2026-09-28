const {describe, before, after, beforeEach, it} = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const supertest = require("supertest");
const {createFixtureServer, json} = require("./fixtureServer");

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
        app = require("../src/server");
        ({clearStsToken} = require("../src/security/sts"));
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
            ["/foersteside/sub/path?name=one%20two&name=three", "/api/foerstesidegenerator/v1/foersteside/sub/path?name=one%20two&name=three"],
        ]) {
            await get(incoming).expect(200);
            assert.equal(generator.requests.at(-1).url, outgoing);
        }
        assert.equal(generator.requests.length, 2);
    });

    it("forwards upstream 4xx and 5xx errors and all error body chunks", async () => {
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
    });

    it("handles an upstream connection failure", async () => {
        generator.respondWith((_request, _response, incoming) => incoming.socket.destroy());
        await get("/foersteside/disconnected").expect(504);
        assert.equal(generator.requests.length, 1);
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
