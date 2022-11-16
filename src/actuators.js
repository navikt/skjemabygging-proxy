// Info GET endpoints
const {logInfo} = require("./utils/log");

function setupAcuators(app) {
    app.get('/internal/health/liveness', (req, res, next) => {
        res.send({
            "status":"UP"
        });
    });
    logInfo('Liveness available on /internal/health/liveness')

    app.get('/internal/health/readiness', (req, res, next) => {
        res.send({
            "status":"UP"
        });
    });
    logInfo('Readiness available on /internal/health/readiness')
}

exports.setupAcuators = setupAcuators;
