import nock from "nock";
import supertest from "supertest";
import app from "../src/server";
import {getToken, getDefaultClaims} from "./securityTestUtils.js";

describe("security", () => {

    nock(process.env.NORG2_BASE_URL)
        .get("/norg2/api")
        .reply(200)

    test("Valid token", async () => {
        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+ getToken(getDefaultClaims()))
            .expect(200)
    });

    test("Missing token", async () => {
        await supertest(app).get("/norg2/api")
            .expect(403)
    });

    test("Invalid audience", async () => {
        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+ getToken(getDefaultClaims().aud = "INVALID_AUDIENCE"))
            .expect(401)
    });

    test("Invalid issuer", async () => {
        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+ getToken(getDefaultClaims().iss = "INVALID_ISSUER"))
            .expect(401)
    });

    test("Expired token", async () => {
        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+ getToken(getDefaultClaims().exp = Math.floor(Date.now()/1000 - 60)))
            .expect(401)
    });

    test("Invalid nbf", async () => {
        await supertest(app).get("/norg2/api")
            .set('Authorization', 'Bearer '+ getToken(getDefaultClaims().nbf = Math.floor(Date.now()/1000 + 60)))
            .expect(401)
    });

});
