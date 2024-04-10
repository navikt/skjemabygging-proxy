import nock from "nock";
import { getStsToken, clearStsToken } from "../src/security/sts";
import { STS_TEST_HOST, STS_TOKEN_URL_PATH, createStsToken } from "./stsTestUtils";

describe("STS token", () => {

    beforeEach(clearStsToken);

    test("Returns previous token when it is not expired", async () => {
        const token1 = createStsToken("foobar", '1m');

        nock(STS_TEST_HOST)
            .get(STS_TOKEN_URL_PATH)
            .reply(200, {access_token: token1});

        expect(await getStsToken()).toEqual(token1);
        expect(await getStsToken()).toEqual(token1);
    });

    test("Renews token when it expires", async () => {
        const token1 = createStsToken("foobar", '1ms');
        const token2 = createStsToken("barfoo", '1m');

        nock(STS_TEST_HOST)
            .get(STS_TOKEN_URL_PATH)
            .reply(200, {access_token: token1})
            .get(STS_TOKEN_URL_PATH)
            .reply(200, {access_token: token2});

        expect(await getStsToken()).toEqual(token1);
        expect(await getStsToken()).toEqual(token2);
    });

});
