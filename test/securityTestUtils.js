import createJWKSMock  from 'mock-jwks'
const jwksMock = createJWKSMock(
    process.env.JWKS_BASEURL,
    process.env.JWKS_PATH
);

jwksMock.start()

export const getDefaultClaims = () => {
    return {
        aud: process.env.AZURE_APP_CLIENT_ID,
        iss: process.env.AZURE_OPENID_CONFIG_ISSUER,
        iat: Math.floor(Date.now()/1000 - 10),
        nbf: Math.floor(Date.now()/1000 - 10),
        exp: Math.floor(Date.now()/1000 + 60*5)
    }
}

export const getToken = (claims) => {
    return  jwksMock.token(claims);
}