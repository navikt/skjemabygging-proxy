const {it} = require("node:test");
const assert = require("node:assert/strict");
const proxy = require("http-proxy-middleware");

it("configures upstream and incoming request timeouts", (t) => {
    let options;
    const original = Object.getOwnPropertyDescriptor(proxy, "legacyCreateProxyMiddleware");
    Object.defineProperty(proxy, "legacyCreateProxyMiddleware", {
        configurable: true,
        value: value => {
            options = value;
            return () => {};
        },
    });
    t.after(() => Object.defineProperty(proxy, "legacyCreateProxyMiddleware", original));
    const {setupProxy} = require("../src/proxyApi");
    setupProxy({use() {}});
    assert.equal(options.proxyTimeout, 25000);
    assert.equal(options.timeout, 25000);
});
