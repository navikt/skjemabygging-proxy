import dotenv from 'dotenv';
import dotEnvExpand from 'dotenv-expand';
import app from './server.js';
import { logInfo } from "./utils/log";

dotEnvExpand.expand(dotenv.config());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Start the Proxy
app.listen(PORT, HOST, () => {
    logInfo(`Starting Proxy at ${HOST}:${PORT}`);
});
