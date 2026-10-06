FROM node:24-alpine

ENV NODE_USE_ENV_PROXY=1

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile
COPY src/ src/

EXPOSE 3000
ENTRYPOINT ["node", "src/index.js"]
