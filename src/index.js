require('dotenv-expand')(require('dotenv').config());
const app = require('./server.js')

// Start the Proxy
app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Starting Proxy at ${process.env.HOST}:${process.env.PORT}`);
});