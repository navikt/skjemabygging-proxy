const config = require("../config.js");
const axios = require("axios");
const {logError, logDebug} = require("../utils/log");

const fetchNewTicket = async () => {
    try {
        const ticketUrl = `${config.exstreamBaseUrl}/tenant1/otdsws/rest/authentication/credentials`;
        const response = await axios.post(ticketUrl, {
            "userName": this.Username,
            "password": this.Password
        });
        const {data} = response;
        return data.ticket;
    } catch (err) {
        logError({
            message: "Could not get ticket from Exstream",
            responseData: err.response.data,
            responseStatus: err.response.status,
        });
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
