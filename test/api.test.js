const nock = require("nock");
const supertest = require("supertest");
const app = require("../src/server");
const securityTestUtils = require("./securityTestUtils.js");
const {STS_TEST_HOST, STS_TOKEN_URL_PATH} = require("./stsTestUtils");

describe("api", () => {

    test("Norg2: Test proxied api response", async () => {

        const response = { testObject: '12345'};

        nock(process.env.NORG2_BASE_URL)
            .get("/norg2/api")
            .reply(200, response);

        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims()))
            .expect(200)
            .then((res) =>
                expect(JSON.stringify(res.body)).toBe(JSON.stringify(response))
            );
    });

    test("Førstesidegenerator: Test proxied api response", async () => {

        const stsScope = nock(STS_TEST_HOST)
            .get(STS_TOKEN_URL_PATH)
            .reply(200, {access_token: "sts-access-token"});

        const response = { testObject: '12345'};

        const foerstesidegeneratorScope = nock(process.env.FOERSTESIDEGENERATOR_BASE_URL)
            .get("/api/foerstesidegenerator/v1/foersteside")
            .reply(200, response);

        await supertest(app).get("/foersteside")
            .set('Authorization', 'Bearer '+securityTestUtils.getToken(securityTestUtils.getDefaultClaims()))
            .expect(200)
            .then((res) =>
                expect(JSON.stringify(res.body)).toBe(JSON.stringify(response))
            );

        stsScope.done();
        foerstesidegeneratorScope.done();
    });

});
