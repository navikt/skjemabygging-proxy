const dotenv = require('dotenv');
const dotEnvExpand = require('dotenv-expand');
dotEnvExpand(dotenv.config({path: './test/test.env'}));
dotEnvExpand(dotenv.config());

require('./security.js');
require('./api.js')