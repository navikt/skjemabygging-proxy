const jwksMock = require('mock-jwks').default(process.env.JWKS_BASEURL, process.env.JWKS_PATH);
jwksMock.start()

exports.getDefaultClaims = () => {
    return {
        aud: process.env.AZURE_APP_CLIENT_ID,
        iss: process.env.AZURE_OPENID_CONFIG_ISSUER,
        iat: Math.floor(Date.now()/1000 - 10),
        nbf: Math.floor(Date.now()/1000 - 10),
        exp: Math.floor(Date.now()/1000 + 60*5)
    }
}

exports.getToken = (claims) => {
    return  jwksMock.token(claims);
}