const nock = require("nock");
const supertest = require("supertest");
const app = require("../src/server");
const securityTestUtils = require("./securityTestUtils.js");


test("Test proxied api response", async () => {

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
