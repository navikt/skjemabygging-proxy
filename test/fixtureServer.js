const http = require("node:http");

async function createFixtureServer() {
    const requests = [];
    let handler = (_request, response) => response.writeHead(500).end("Unexpected fixture request");
    const server = http.createServer(async (request, response) => {
        try {
            const chunks = [];
            for await (const chunk of request) {
                chunks.push(chunk);
            }
            const recorded = {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: Buffer.concat(chunks).toString(),
            };
            requests.push(recorded);
            await handler(recorded, response, request);
        } catch (error) {
            if (!response.headersSent && !response.destroyed) {
                response.writeHead(500).end(error.message);
            }
        }
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        requests,
        respondWith(callback) {
            handler = callback;
            requests.length = 0;
        },
        async close() {
            server.closeAllConnections();
            await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        },
    };
}

function json(response, status, value) {
    response.writeHead(status, {"content-type": "application/json"});
    response.end(JSON.stringify(value));
}

module.exports = {createFixtureServer, json};
