const dotenv = require('dotenv');
const dotEnvExpand = require('dotenv-expand');
const app = require('./server.js')
const {logInfo} = require("./utils/log");

dotEnvExpand.expand(dotenv.config());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Start the Proxy
app.listen(PORT, HOST, () => {
    logInfo(`Starting Proxy at ${HOST}:${PORT}`);
});
