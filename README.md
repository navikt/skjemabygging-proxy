# skjemabygging-proxy

skjemabygging-proxy er en applikasjon bygget med nodejs/express med hensikt av å gi skjemabygging-appene tilgang til å
kalle systemer som kjører i fagsystemsonen, f.eks. exstream eller foerstesidegeneratoren.

## Funksjonalitet
Applikasjonen eksponerer ulike endepunkt og ruter forespørselen videre til applikasjoner som kjører i fss.

## Lokalkjøring
Applikasjonen kan kjøres opp lokalt med kommandoen "yarn start", og blir da tilgjengelig på "http:localhost:3000".
Man må opprette en .env-fil og sette NODE_ENV til development for å slippe Azure autentisering.

    FOERSTESIDEGENERATOR_BASE_URL=https://foerstesidegenerator-q1.dev.intern.nav.no
    FOERSTESIDEGENERATOR_API_KEY=<foerstesidegenerator api key>
    STS_TOKEN_URL=https://security-token-service.dev.adeo.no/rest/v1/sts/token
    STS_TOKEN_API_KEY=<sts api key>
    SERVICEUSER_USERNAME=srvsoknadsveiviser
    SERVICEUSER_PASSWORD=<serviceuser password>
    NAIS_TOKEN_INTROSPECTION_ENDPOINT=https://token-introspection.nais.no
    OPPDATERENHETSINFO_BASE_URL=<oppdaterer base url>
    EXSTREAM_BASE_URL=https://dokument1-q.adeo.no
    EXSTREAM_USERNAME=tenantadmin@strs.role
    EXSTREAM_PASSWORD=
    NODE_ENV=development

Førstesidegenerator- og STS-relaterte variabler finnes i kubernetes secrets for skjemabygging-proxy.

## Deployment
Applikasjonen benytter seg av github actions for deployment. Bruk `manual-deployment` action for manuelle deploys. Endringer på "main" branch vil deployes til "prod-fss". 
