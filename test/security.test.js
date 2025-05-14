const nock = require("nock");
const supertest = require("supertest");
const app = require("../src/server");
const securityTestUtils = require("./securityTestUtils.js");
const { STS_TEST_HOST, STS_TOKEN_URL_PATH } = require("./stsTestUtils");

describe("security", () => {

    beforeEach(() => {
        nock(STS_TEST_HOST)
            .get(STS_TOKEN_URL_PATH)
            .reply(200, {access_token: "sts-access-token"});
        nock(process.env.FOERSTESIDEGENERATOR_BASE_URL)
            .get("/api/foerstesidegenerator/v1/foersteside")
            .reply(200)
    });

    test("Returns 200 OK when token is valid", async () => {
        nock(process.env.NAIS_TOKEN_INTROSPECTION_ENDPOINT)
            .post(/.*/)
            .reply(200, {active: true});
        await supertest(app).get("/foersteside")
            .set('Authorization', securityTestUtils.mockAuthHeader)
            .expect(200);
    })

    test("Returns 403 Forbidden when token is missing", async () => {
        await supertest(app).get("/foersteside")
            .expect(403);
    });

    test("Returns 401 Unauthorized when token is invalid", async () => {
        nock(process.env.NAIS_TOKEN_INTROSPECTION_ENDPOINT)
            .post(/.*/)
            .reply(200, {active: false, error: "invalid"});
        await supertest(app).get("/foersteside")
            .set('Authorization', securityTestUtils.mockAuthHeader)
            .expect(401);
    });

    test("Returns 500 when token cannot be validated", async () => {
        nock(process.env.NAIS_TOKEN_INTROSPECTION_ENDPOINT)
            .post(/.*/)
            .reply(500);
        await supertest(app).get("/foersteside")
            .set('Authorization', securityTestUtils.mockAuthHeader)
            .expect(500);
    });

});
