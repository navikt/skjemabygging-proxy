const dotenv = require('dotenv');
const dotEnvExpand = require('dotenv-expand');
const nock = require("nock");

dotEnvExpand(dotenv.config({path: './test/test.env'}));
dotEnvExpand(dotenv.config());

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');
