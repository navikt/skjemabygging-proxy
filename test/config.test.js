describe("config", () => {
    const originalTimeout = process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS;

    afterEach(() => {
        process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = originalTimeout;
        jest.resetModules();
    });

    test("parses the Foerstesidegenerator timeout", () => {
        process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = "25000";

        expect(require("../src/config").foerstesidegeneratorTimeoutMs).toBe(25000);
    });

    test.each([undefined, "invalid", "0", "1.5"])("rejects invalid Foerstesidegenerator timeout %p", (value) => {
        if (value === undefined) {
            delete process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS;
        } else {
            process.env.FOERSTESIDEGENERATOR_TIMEOUT_MS = value;
        }

        expect(() => require("../src/config")).toThrow("FOERSTESIDEGENERATOR_TIMEOUT_MS must be a positive integer");
    });
});
