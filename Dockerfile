FROM navikt/node-express:14-alpine

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile
COPY src/ src/
COPY .env .env

EXPOSE 3000
ENTRYPOINT ["node", "src/index.js"]
