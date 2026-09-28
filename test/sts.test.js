const {describe, before, after, beforeEach, it} = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const {createFixtureServer, json} = require("./fixtureServer");

describe("STS token", () => {
    let sts;
    let getStsToken;
    let clearStsToken;

    before(async () => {
        sts = await createFixtureServer();
        process.env.STS_TOKEN_URL = `${sts.url}/rest/v1/sts/token`;
        ({getStsToken, clearStsToken} = require("../src/security/sts"));
    });

    after(async () => sts?.close());
    beforeEach(() => clearStsToken());

    const createToken = (sub, expiresIn) => jwt.sign({sub}, "test", {expiresIn});

    it("sends client credentials, scope, API key and Basic authentication, then caches the token", async () => {
        const token = createToken("first", "1h");
        sts.respondWith((_request, response) => json(response, 200, {access_token: token}));
        assert.equal(await getStsToken(), token);
        assert.equal(await getStsToken(), token);
        assert.equal(sts.requests.length, 1);
        assert.equal(sts.requests[0].method, "GET");
        assert.equal(sts.requests[0].url, "/rest/v1/sts/token?grant_type=client_credentials&scope=openid");
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

    it("rejects failed STS responses and retries instead of caching an error", async () => {
        const token = createToken("recovered", "1h");
        let calls = 0;
        sts.respondWith((_request, response) => {
            if (++calls === 1) return json(response, 503, {error: "unavailable"});
            json(response, 200, {access_token: token});
        });
        await assert.rejects(getStsToken(), /503/);
        assert.equal(await getStsToken(), token);
        assert.equal(sts.requests.length, 2);
    });
});
