# skjemabygging-proxy

skjemabygging-proxy er en applikasjon bygget med nodejs/express med hensikt av å gi skjemabygging-appene tilgang til å
kalle systemer som kjører i fagsystemsonen, f.eks. norg2 eller foerstesidegeneratoren.

## Funksjonalitet
applikasjonen eksponerer et endepunkt på /norg2 som ruter alle kall videre til norg2.
eksempelvis vil kall til <skjemabygging-proxy-baseurl>/norg2/api/v1/enhet rutes til <norg2-baseurl>/norg2/api/v1/enhet

## Lokalkjøring
Applikasjonen kan kjøres opp lokalt med kommandoen "yarn start", og blir da tilgjengelig på "http:localhost:3000",
appen stiller krav til at følgende variabler er tilgjengelig (verdier hentet fra dev-miljø):

    NORG2_BASE_URL=https://norg2.dev.intern.nav.no
    FOERSTESIDEGENERATOR_BASE_URL=https://foerstesidegenerator.dev.intern.nav.no
    AZURE_OPENID_CONFIG_JWKS_URI=<jwks url>
    AZURE_OPENID_CONFIG_ISSUER=<issuer url>
    AZURE_APP_CLIENT_ID=<proxy app clientID>
    STS_TOKEN_URL=<sts token url>
    STS_TOKEN_API_KEY=<sts api key>

JWKS_URI og ISSUER kan hentes fra https://login.microsoftonline.com/966ac572-f5b7-4bbe-aa88-c76419c0f851/v2.0/.well-known/openid-configuration,
og CLIENT_ID for proxy finnes slik: https://security.labs.nais.io/pages/idp/azure-ad.html#hvordan-finne-clientid-for-applikasjoner

## Deployment
Applikasjonen benytter seg av github actions for deployment. Ved push som inneholder endringer i branch 
"main" eller "dev/*" vil applikasjonen bygges på et dockerimage og ny versjon vil deployes ut til NAIS.

Endringer på "main" branch vil deployes ut til både "dev-gcp" og "prod-gcp" mens endringer i en "dev/*" branch vil bare deployes til "dev-gcp"
