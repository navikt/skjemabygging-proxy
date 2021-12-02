require('dotenv-expand')(require('dotenv').config());
const app = require('./server.js')

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});
