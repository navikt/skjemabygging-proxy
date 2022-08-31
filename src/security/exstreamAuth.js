const correlator = require('express-correlation-id');
const config = require('../config.js');
//import {pinoLogger} from '../log/logConfig.js';
//const log = pinoLogger.child({module: 'ExstreamAuth'});
//import {TokenSet} from 'openid-client';
const axios = require("axios");

const logError = logObject => {
    const correlationId = correlator.getId();
    console.log(JSON.stringify({
        ...logObject,
        url: URL,
        correlation_id: correlationId
    }));
};

class ExstreamAuth {
    ticket;
    ticket_timestamp;
    token;
    Username = config.exstreamUsername;
    Password = config.exstreamPassword;
    //Client_secret = config.exstreamClientSecret;

    constructor() {
        this.fetchNewTicket()
            .then((res) => {
                console.info('Hentet ticket fra Exstream');
            })
            .catch((err) => {
                console.error('Klarte ikke å hente ticket til Exstream under oppstart. Forsøker på nytt ved behov');
            });
        /*this.fetchOrRefreshToken()
            .then((res) => {
                log.info('Hentet token fra Exstream');
            })
            .catch((err) => {
                log.error('Klarte ikke å hente token til Exstream under oppstart. Forsøker på nytt ved behov');
            });*/
    }

    async getTicket() {
        if (this.ticketExpired()) {
            console.info('Exstream ticket expired, requesting a new ticket');
            await this.fetchNewTicket();
        }
        return this.ticket;
    }

    /* async getToken() {
        if (!this.token || this.token.expired()) {
            log.info('Exstream token expired, requesting a new token');
            await this.fetchOrRefreshToken();
        }
        return this.token.access_token;
    } */

    async fetchNewTicket() {
        try {
            const response = await axios.post(config.exstreamTicketUrl, {
                'userName': this.Username,
                'password': this.Password
            });
                const { data } = response;
                this.ticket = data.ticket;
                this.ticket_timestamp = Date.now();
        } catch (err) {
            logError({
                message: "Klarte ikke hente ticket fra Exstream.",
                responseData: err.response.data,
                responseStatus: err.response.status,
            });
            throw err;
        }
    };

    /*async fetchOrRefreshToken() {
        try {
            const response = await axios.post(config.exstreamTokenUrl, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'grant_type': 'password',
                    'username': this.Username,
                    'password': this.Password,
                    'client_id': 'Exstream',
                    'scope': 'resource:Exstream',
                    'client_secret': this.Client_secret
                }),
            });
            if (response.status === 200) {
                const data = await response.json();
                this.token = new TokenSet(data);
            }else {
                log.info('Status %s fra Exstream ved forsøk på å hente token', response.status);
                throw new Error("Klarte ikke hente token");
            }
        } catch (err) {
            log.error('Klarte ikke hente token fra Exstream. %s', err);
            throw err;
        }
    }*/

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
