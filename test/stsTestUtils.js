const jwt = require("jsonwebtoken");
const STS_TEST_HOST = "https://security-token-service.testhost.no";
const STS_TOKEN_URL_PATH = "/rest/v1/sts/token?grant_type=client_credentials&scope=openid";

function createStsToken(data, expiresIn) {
    return jwt.sign({
        data
    }, 'secret', {expiresIn});
}

module.exports = {
    STS_TEST_HOST,
    STS_TOKEN_URL_PATH,
    createStsToken,
};
