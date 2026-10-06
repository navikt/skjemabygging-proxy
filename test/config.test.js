import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {createConfig} from "../src/config.js";

describe("config", () => {
    it("parses the Foerstesidegenerator timeout", () => {
        assert.equal(createConfig({FOERSTESIDEGENERATOR_TIMEOUT_MS: "25000"}).foerstesidegeneratorTimeoutMs, 25000);
    });

    for (const value of [undefined, "invalid", "0", "1.5"]) {
        it(`rejects invalid Foerstesidegenerator timeout ${String(value)}`, () => {
            assert.throws(() => createConfig({FOERSTESIDEGENERATOR_TIMEOUT_MS: value}), /FOERSTESIDEGENERATOR_TIMEOUT_MS must be a positive integer/);
        });
    }
});
