FROM node:21.7.1-alpine

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile
COPY src/ src/

EXPOSE 3000
ENTRYPOINT ["node", "src/index.js"]
