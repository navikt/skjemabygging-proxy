const correlation = require("express-correlation-id");

const logDebug = logObject => {
    console.debug(createLog(logObject));
};

const logInfo = logObject => {
    console.info(createLog(logObject));
};

const logWarn = logObject => {
    console.warn(createLog(logObject));
};

const logError = logObject => {
    console.log(createLog(logObject));
};

const createLog = message => {
    if (typeof message === "string") {
        message = {
            message: message,
        };
    }

    return JSON.stringify({
        ...message,
        correlation_id: correlation.getId(),
    });
};

module.exports = {
    logDebug,
    logInfo,
    logWarn,
    logError,
}
