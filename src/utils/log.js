import correlation from "express-correlation-id";
import config from "../config";

const levels = {
    "debug": 1,
    "info": 2,
    "warn": 3,
    "error": 4,
}

const appLogLevel = levels[config.logLevel || "info"];

const isEnabled = logLevel => levels[logLevel] >= appLogLevel;

const logDebug = logObject => {
    if (isEnabled("debug")) {
        console.debug(createLog(logObject, "debug"));
    }
};

const logInfo = logObject => {
    if (isEnabled("info")) {
        console.info(createLog(logObject, "info"));
    }
};

const logWarn = logObject => {
    if (isEnabled("warn")) {
        console.warn(createLog(logObject, "warn"));
    }
};

const logError = logObject => {
    if (isEnabled("error")) {
        console.error(createLog(logObject, "error"));
    }
};

const createLog = (message, level) => {
    if (typeof message === "string") {
        message = {
            message: message,
        };
    }

    return JSON.stringify({
        ...message,
        level,
        correlation_id: correlation.getId(),
    });
};

export {
    logDebug,
    logInfo,
    logWarn,
    logError,
}
