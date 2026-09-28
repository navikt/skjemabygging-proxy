const {describe, afterEach, it} = require("node:test");
const assert = require("node:assert/strict");

describe("config", () => {
    const originalTimeout = process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS;

    afterEach(() => {
        if (originalTimeout === undefined) delete process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS;
        else process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = originalTimeout;
        delete require.cache[require.resolve("../src/config")];
    });

    it("parses the Foerstesidegenerator timeout", () => {
        process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = "25000";
        assert.equal(require("../src/config").foerstesidegeneratorTimeoutMs, 25000);
    });

    for (const value of [undefined, "invalid", "0", "1.5"]) {
        it(`rejects invalid Foerstesidegenerator timeout ${String(value)}`, () => {
            if (value === undefined) delete process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS;
            else process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = value;
            assert.throws(() => require("../src/config"), /FOERSTESIDEGENERATOR_TIMEOUT_MS must be a positive integer/);
        });
    }
});
