# skjemabygging-proxy

skjemabygging-proxy er en applikasjon bygget med nodejs/express med hensikt av å gi skjemabygging-appene tilgang til å
kalle systemer som kjører i fagsystemsonen, f.eks. foerstesidegeneratoren.

## Funksjonalitet
Applikasjonen eksponerer ulike endepunkt og ruter forespørselen videre til applikasjoner som kjører i fss.

## Lokalkjøring
Applikasjonen kan kjøres opp lokalt med kommandoen "yarn start", og blir da tilgjengelig på "http:localhost:3000".

    FOERSTESIDEGENERATOR_BASE_URL=https://foerstesidegenerator-q1.dev.intern.nav.no
    FOERSTESIDEGENERATOR_TIMEOUT_MS=25000
    FOERSTESIDEGENERATOR_API_KEY=<foerstesidegenerator api key>
    STS_TOKEN_URL=https://security-token-service.dev.adeo.no/rest/v1/sts/token
    STS_TOKEN_API_KEY=<sts api key>
    SERVICEUSER_USERNAME=srvsoknadsveiviser
    SERVICEUSER_PASSWORD=<serviceuser password>
    NAIS_TOKEN_INTROSPECTION_ENDPOINT=https://token-introspection.nais.no
    NODE_ENV=development

Førstesidegenerator- og STS-relaterte variabler finnes i kubernetes secrets for skjemabygging-proxy.

For local development, create `.env` in the repository root and run `yarn start`.
The file is optional; provide required settings through your shell when you do not have one.
Set `NODE_ENV=development` to bypass Azure authentication locally.
The start command uses `node --env-file-if-exists=.env`, which leaves existing shell variables unchanged.
Use literal values in `.env`. Node does not expand `${VAR}` references or run `$(command)`.
Tests load `test/test.env` instead of your root `.env`.
The Docker entrypoint runs `node src/index.js` and uses environment variables supplied by NAIS.

## Deployment
Applikasjonen benytter seg av github actions for deployment. Bruk `manual-deployment` action for manuelle deploys. Endringer på "main" branch vil deployes til "prod-fss". 

## Monitoring `/foersteside`

The proxy exports `http_request_duration_seconds` with bounded `path`, `method`, and `status_code` labels. A five-minute 500/504 response ratio can be monitored with:

```promql
sum(rate(http_request_duration_seconds_count{app="skjemabygging-proxy",k8s_cluster_name="prod-fss",path="/foersteside",status_code=~"500|504"}[5m]))
/
sum(rate(http_request_duration_seconds_count{app="skjemabygging-proxy",k8s_cluster_name="prod-fss",path="/foersteside"}[5m]))
```

The configured 25-second timeout is represented in the histogram. Monitor the proportion of requests taking more than 20 seconds with:

```promql
1 - (
  sum(rate(http_request_duration_seconds_bucket{app="skjemabygging-proxy",k8s_cluster_name="prod-fss",path="/foersteside",le="20"}[5m]))
  /
  sum(rate(http_request_duration_seconds_count{app="skjemabygging-proxy",k8s_cluster_name="prod-fss",path="/foersteside"}[5m]))
)
```
