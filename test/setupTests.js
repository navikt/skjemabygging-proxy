import dotenv from 'dotenv';
import dotEnvExpand from 'dotenv-expand';
import nock from "nock";

dotEnvExpand.expand(dotenv.config({path: './test/test.env'}));
dotEnvExpand.expand(dotenv.config());

nock.disableNetConnect();
console.log('ENEABLE', process.env.JWKS_HOST)
nock.enableNetConnect(host => host.includes('127.0.0.1') || host.includes(process.env.JWKS_HOST));
