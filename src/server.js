const express = require('express');
const morgan = require("morgan");
const promBundle = require("express-prom-bundle");
const ecsFormat = require('@elastic/ecs-morgan-format')
const correlator = require('express-correlation-id');
const actuators = require('./actuators.js')
const config = require('./config');
const proxyApi = require('./proxyApi.js')
const {logError} = require("./utils/log");

// Create Express Server
const app = express();
app.use(correlator());

// Logging
app.use(morgan((token, req, res) => {
    const logEntry = JSON.parse(ecsFormat({ apmIntegration: false })(token, req, res));
    logEntry.level = res.statusCode < 500 ? "Info" : "Error";
    logEntry.correlation_id = correlator.getId();
    delete logEntry.http;
    delete logEntry.url;
    delete logEntry.client;
    delete logEntry.user_agent;
    return JSON.stringify(logEntry);
}, {
    skip: function (req, res) {
        if (config.logLevel === "debug") {
            return req.path.startsWith("/internal");
        }
        return res.statusCode < 400;
    }
}));

// Add the options to the prometheus middleware most option are for http_request_duration_seconds histogram metric
const metricsMiddleware = promBundle({
    metricsPath: "/internal/prometheus",
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    promClient: {
        collectDefaultMetrics: {
        }
    }
});

// add the prometheus middleware to all routes
app.use(metricsMiddleware)

proxyApi.setupProxy(app);
actuators.setupAcuators(app);

app.use((err, req, res, next) => {
    logError({message: err.message});
    res.status(500);
    res.contentType("application/json");
    res.send({ message: err.message, correlation_id: correlator.getId() });
});

module.exports = app;
