# skjemabygging-proxy

skjemabygging-proxy er en applikasjon bygget med nodejs/express med hensikt av å gi skjemabygging-appene tilgang til å
kalle systemer som kjører i fagsystemsonen, f.eks. exstream eller foerstesidegeneratoren.

## Funksjonalitet
Applikasjonen eksponerer ulike endepunkt og ruter forespørselen videre til applikasjoner som kjører i fss.

## Lokalkjøring
Applikasjonen kan kjøres opp lokalt med kommandoen "yarn start", og blir da tilgjengelig på "http:localhost:3000",
appen stiller krav til at følgende variabler er tilgjengelig (verdier hentet fra dev-miljø):

    FOERSTESIDEGENERATOR_BASE_URL=https://foerstesidegenerator-q1.dev.intern.nav.no
    FOERSTESIDEGENERATOR_API_KEY=<foerstesidegenerator api key>
    STS_TOKEN_URL=https://security-token-service.dev.adeo.no/rest/v1/sts/token
    STS_TOKEN_API_KEY=<sts api key>
    SERVICEUSER_USERNAME=srvsoknadsveiviser
    SERVICEUSER_PASSWORD=<serviceuser password>
    AZURE_OPENID_CONFIG_JWKS_URI=<jwks url>
    AZURE_OPENID_CONFIG_ISSUER=<issuer url>
    AZURE_APP_CLIENT_ID=<proxy app clientID>
    OPPDATERENHETSINFO_BASE_URL=<oppdaterer base url>
    EXSTREAM_BASE_URL=https://dokument1-q.adeo.no
    EXSTREAM_USERNAME=tenantadmin@strs.role
    EXSTREAM_PASSWORD=

JWKS_URI og ISSUER kan hentes fra https://login.microsoftonline.com/966ac572-f5b7-4bbe-aa88-c76419c0f851/v2.0/.well-known/openid-configuration,
og CLIENT_ID for proxy finnes slik: https://security.labs.nais.io/pages/idp/azure-ad.html#hvordan-finne-clientid-for-applikasjoner

Man kan sette env til development for å slippe Azure autentisering.

    NODE_ENV=development

Førstesidegenerator- og STS-relaterte variabler finnes i kubernetes secrets for skjemabygging-proxy.

## Deployment
Applikasjonen benytter seg av github actions for deployment. Bruk `manual-deployment` action for manuelle deploys. Endringer på "main" branch vil deployes til "prod-fss". 
