const config = require("../config.js");
const axios = require("axios");
const {logError, logInfo, logDebug} = require("../utils/log");

class ExstreamAuth {
    ticket;
    ticketTimestamp;
    token;
    Username = config.exstreamUsername;
    Password = config.exstreamPassword;

    constructor() {
        (async () => {
            try {
                await this.fetchNewTicket();
                logInfo("Get ticket from Exstream");
            } catch (e) {
                logError("Could not get ticket from Exstream during startup. Will try again on next request.");
            }
        })();
    }

    async getTicket() {
        if (this.ticketExpired()) {
            logInfo("Exstream ticket expired, requesting a new ticket");
            await this.fetchNewTicket();
        }
        return this.ticket;
    }

    async fetchNewTicket() {
        try {
            const ticketUrl = `${config.exstreamBaseUrl}/tenant1/otdsws/rest/authentication/credentials`;
            const response = await axios.post(ticketUrl, {
                "userName": this.Username,
                "password": this.Password
            });
            const {data} = response;
            this.ticket = data.ticket;
            this.ticketTimestamp = Date.now();
            logDebug("Got new ticket");
            logDebug(data);
        } catch (err) {
            logError({
                message: "Could not get ticket from Exstream",
                responseData: err.response.data,
                responseStatus: err.response.status,
            });
            throw err;
        }
    };

    ticketExpired() {
        logDebug("Validate ticket expiration timestamp");
        if (!this.ticket || !this.ticketTimestamp) {
            return true;
        }
        const tokenAgeHours = Math.ceil((Date.now() - this.ticketTimestamp) / 1000 / 60 / 60);

        if (tokenAgeHours >= 8) {
            return false;
        } else {
            logDebug("Exstream ticket have expired");
            return true;
        }
    }
}

const exstreamAuth = new ExstreamAuth();

const exstreamTokenHandler = async (req, res, next) => {
    try {
        const ticket = await exstreamAuth.getTicket();
        logDebug("Add OTDSTicket to header");
        req.headers["OTDSTicket"] = ticket;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    exstreamTokenHandler,
}
