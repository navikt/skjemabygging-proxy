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

    test("Valid token", async () => {
        await supertest(app).get("/foersteside")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims()))
            .expect(200)
    });

    test("Missing token", async () => {
        await supertest(app).get("/foersteside")
            .expect(403)
    });

    test("Invalid audience", async () => {
        await supertest(app).get("/foersteside")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims().aud = "INVALID_AUDIENCE"))
            .expect(401)
    });

    test("Invalid issuer", async () => {
        await supertest(app).get("/foersteside")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims().iss = "INVALID_ISSUER"))
            .expect(401)
    });

    test("Expired token", async () => {
        await supertest(app).get("/foersteside")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims().exp = Math.floor(Date.now()/1000 - 60)))
            .expect(401)
    });

    test("Invalid nbf", async () => {
        await supertest(app).get("/foersteside")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims().nbf = Math.floor(Date.now()/1000 + 60)))
            .expect(401)
    });

});
