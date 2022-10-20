const config = require("../config.js");
const axios = require("axios");
const {logError, logInfo} = require("../utils/log");

class ExstreamAuth {
    ticket;
    ticket_timestamp;
    token;
    Username = config.exstreamUsername;
    Password = config.exstreamPassword;

    constructor() {
        this.fetchNewTicket()
            .then((res) => {
                logInfo("Get ticket from Exstream")
            })
            .catch((err) => {
                logError("Could not get ticket from Exstream during startup. Will try again on next request.");
            });
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
            const response = await axios.post(config.exstreamTicketUrl, {
                "userName": this.Username,
                "password": this.Password
            });
                const { data } = response;
                this.ticket = data.ticket;
                this.ticket_timestamp = Date.now();
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
        if (!this.ticket || !this.ticket_timestamp) {
            return true;
        }
        const tokenAgeHours = Math.ceil((Date.now() - this.ticket_timestamp)/1000/60/60);

        return tokenAgeHours >= 8;
    }
}

const exstreamAuth = new ExstreamAuth();

const exstreamTokenHandler = async (req, res, next) => {
    try {
        req.headers["ODTSTicket"] = await exstreamAuth.getTicket();
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    exstreamTokenHandler,
}
