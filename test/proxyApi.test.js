const {legacyCreateProxyMiddleware} = require("http-proxy-middleware");

jest.mock("http-proxy-middleware", () => ({
    legacyCreateProxyMiddleware: jest.fn(() => "proxy middleware"),
}));

const {setupProxy} = require("../src/proxyApi");

test("configures upstream and incoming request timeouts", () => {
    const app = {use: jest.fn()};

    setupProxy(app);

    expect(legacyCreateProxyMiddleware).toHaveBeenCalledWith(expect.objectContaining({
        proxyTimeout: 25000,
        timeout: 25000,
    }));
});
