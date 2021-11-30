# skjemabygging-proxy

skjemabygging-proxy er en applikasjon bygget med nodejs/express med hensikt av å gi trykknok tilgang til norg2. skjemabygging har ikke tilgang til interne addresser, 
derfor eksponeres skjemabygging-proxy ut til verden.

## funksjonalitet
applikasjonen eksponerer et endepunkt på /norg2 som ruter alle kall videre til norg2. Path som bygges på etter /team-catalog/ bygger på pathen som rutes til norg2.
eksempelvis vil kall til <skjemabygging-proxy-baseurl>/norg2/api/v1/enhet rutes til <norg2-baseurl>/api/v1/enhet

## Tester
Testene i applikasjonen er laget med bibliotekene jest, supertest og benytter seg av mock-jwks og nock for å mocke ut eksterne kall.

Testene kan kjøres ved å kjøre kommandoen "npm test".

## Lokalkjøring
Applikasjonen kan kjøres opp lokalt med kommandoen "npm start", og blir da tilgjengelig på "http:localhost:3000", appen stiller krav til at følgende variable er tilgjengelig:

NORG2_BACKEND_URL= < norg2-baseurl ><br/>
AZURE_OPENID_CONFIG_JWKS_URI=< jwks url ><br/>
AZURE_OPENID_CONFIG_ISSUER=< issuer ur ><br/>
AZURE_APP_CLIENT_ID=< app clientID ><br/>

## Deployment
Applikasjonen benytter seg av github actions for deployment. Ved push som inneholder endirnger i branch "main" eller "dev/*" vil applikasjonen bygges på et dockerimage
og ny versjon vil deployes ut til NAIS.

Endringer på "main" branch vil deployes ut til både "dev-gcp" og "prod-gcp" mens endringer i en "dev/*" branch vil bare deployes til "dev-gcp"
