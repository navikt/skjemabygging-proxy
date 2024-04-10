import nock from "nock";
import supertest from "supertest";
import app from "../src/server";
import { getToken, getDefaultClaims } from "./securityTestUtils.js"
import {STS_TEST_HOST, STS_TOKEN_URL_PATH} from "./stsTestUtils"

describe("api", () => {

    test("Norg2: Test proxied api response", async () => {

        const response = { testObject: '12345'};

        nock(process.env.NORG2_BASE_URL)
            .get("/norg2/api")
            .reply(200, response);

        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+getToken(getDefaultClaims()))
            .expect(200)
            .then((res) =>
                expect(JSON.stringify(res.body)).toBe(JSON.stringify(response))
            );
    });

    test("Oppdaterenhetsinfo: Test proxied api response", async () => {

        const response = { testObject: '12345'};

        nock(process.env.OPPDATERENHETSINFO_BASE_URL)
            .get("/oppdaterenhetsinfo/api/hentenheter")
            .reply(200, response);

        await supertest(app).get("/oppdaterenhetsinfo/api/hentenheter")
            .set('Authorization', 'Bearer '+getToken(getDefaultClaims()))
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
            .set('Authorization', 'Bearer '+getToken(getDefaultClaims()))
            .expect(200)
            .then((res) =>
                expect(JSON.stringify(res.body)).toBe(JSON.stringify(response))
            );

        stsScope.done();
        foerstesidegeneratorScope.done();
    });

});
