import {describe, before, after, beforeEach, it} from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import {createFixtureServer, json} from "./fixtureServer.js";

describe("authentication", () => {
    let introspection;
    let sts;
    let generator;
    let app;
    let clearStsToken;

    before(async () => {
        [introspection, sts, generator] = await Promise.all([
            createFixtureServer(), createFixtureServer(), createFixtureServer(),
        ]);
        process.env.NODE_ENV = "test";
        process.env.NAIS_TOKEN_INTROSPECTION_ENDPOINT = `${introspection.url}/introspect`;
        process.env.STS_TOKEN_URL = `${sts.url}/rest/v1/sts/token`;
        process.env.FOERSTESIDEGENERATOR_BASE_URL = generator.url;
        ({default: app} = await import("../src/server.js"));
        ({clearStsToken} = await import("../src/security/sts.js"));
    });

    after(async () => {
        await Promise.all([introspection, sts, generator].map(fixture => fixture?.close()));
    });

    beforeEach(() => {
        clearStsToken();
        introspection.respondWith((_request, response) => json(response, 200, {active: true}));
        sts.respondWith((_request, response) => json(response, 200, {
            access_token: jwt.sign({sub: "service"}, "test", {expiresIn: "1h"}),
        }));
        generator.respondWith((_request, response) => json(response, 200, {ok: true}));
    });

    it("introspects a valid bearer token with the Azure identity provider", async () => {
        await supertest(app).get("/foersteside").set("Authorization", "Bearer caller-token").expect(200);
        assert.equal(introspection.requests.length, 1);
        assert.equal(introspection.requests[0].method, "POST");
        assert.equal(introspection.requests[0].url, "/introspect");
        assert.match(introspection.requests[0].headers["content-type"], /^application\/json/);
        assert.deepEqual(JSON.parse(introspection.requests[0].body), {
            identity_provider: "azuread", token: "caller-token",
        });
        assert.equal(sts.requests.length, 1);
        assert.equal(generator.requests.length, 1);
    });

    it("rejects a missing token before making upstream requests", async () => {
        const response = await supertest(app).get("/foersteside").expect(403);
        assert.equal(response.body.path, "/foersteside");
        assert.equal(introspection.requests.length, 0);
        assert.equal(sts.requests.length, 0);
        assert.equal(generator.requests.length, 0);
    });

    it("rejects an inactive token without contacting STS or the generator", async () => {
        introspection.respondWith((_request, response) => json(response, 200, {active: false, error: "invalid"}));
        await supertest(app).get("/foersteside").set("Authorization", "Bearer caller-token").expect(401);
        assert.equal(introspection.requests.length, 1);
        assert.equal(sts.requests.length, 0);
        assert.equal(generator.requests.length, 0);
    });

    it("returns 500 when introspection fails", async () => {
        introspection.respondWith((_request, response) => json(response, 500, {error: "unavailable"}));
        await supertest(app).get("/foersteside").set("Authorization", "Bearer caller-token").expect(500);
        assert.equal(introspection.requests.length, 1);
        assert.equal(sts.requests.length, 0);
        assert.equal(generator.requests.length, 0);
    });
});
