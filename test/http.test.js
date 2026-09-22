const {PassThrough} = require("stream");
const {logError, logWarn} = require("../src/utils/log");

jest.mock("../src/utils/log", () => ({
    logError: jest.fn(),
    logWarn: jest.fn(),
}));

const {logProxyResError} = require("../src/utils/http");

const logResponse = async (statusCode) => {
    const proxyRes = new PassThrough();
    proxyRes.statusCode = statusCode;
    proxyRes.headers = {"content-type": "application/json"};
    const logging = logProxyResError(proxyRes, {url: "/foersteside"});
    proxyRes.end(JSON.stringify({message: "sanitized downstream response"}));
    await logging;
};

beforeEach(() => jest.clearAllMocks());

test("logs downstream 4xx responses as warnings", async () => {
    await logResponse(400);

    expect(logWarn).toHaveBeenCalledWith(expect.objectContaining({
        httpStatus: 400,
        url: "/foersteside",
        proxyResponseBody: JSON.stringify({message: "sanitized downstream response"}),
    }));
    expect(logError).not.toHaveBeenCalled();
});

test("logs downstream 5xx responses as errors", async () => {
    await logResponse(500);

    expect(logError).toHaveBeenCalledWith(expect.objectContaining({
        httpStatus: 500,
        url: "/foersteside",
        proxyResponseBody: JSON.stringify({message: "sanitized downstream response"}),
    }));
    expect(logWarn).not.toHaveBeenCalled();
});
