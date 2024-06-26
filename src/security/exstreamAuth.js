const config = require("../config.js");
const axios = require("axios");
const {logError, logDebug} = require("../utils/log");

const fetchNewTicket = async () => {
    try {
        const ticketUrl = `${config.exstreamTicketBaseUrl}/otdsws/rest/authentication/credentials`;
        const response = await axios.post(ticketUrl, {
            "userName": config.exstreamUsername,
            "password": config.exstreamPassword,
        });
        const {data} = response;
        return data.ticket;
    } catch (err) {
        logError("Could not get ticket from Exstream");
        throw err;
    }
};

const exstreamTokenHandler = async (req, res, next) => {
    try {
        const ticket = await fetchNewTicket();
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
