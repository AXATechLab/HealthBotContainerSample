require('dotenv').config();

const helmet = require('helmet')
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')

const { SECURITY } = require('./settings');
const { ENV } = require('./constants');
const startAppInsights = require('./application-insights');
const DirectlineClient = require('./directline-client');
const Logger = require('./logger');

const logger = Logger.getLogger();

if (process.env.NODE_ENV === ENV.PRODUCTION) {
    startAppInsights();
}

const app = express();

app.use(helmet());
app.use(helmet.contentSecurityPolicy(SECURITY.CSP_POLICY));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false, limit: SECURITY.BODY_SIZE_LIMIT }));
app.use(bodyParser.json());
app.use(errorHandler);
app.use(express.static(path.join(__dirname, '..', 'public')));

const directlineClient = new DirectlineClient(process.env.WEBCHAT_SECRET);

function errorHandler(err, req, res, next) {
    res.status(500).send();
}

const port = process.env.PORT || 3000;
const expiryOffsetMinutes = process.env.EXPIRY_TIME_IN_MINUTES ? parseInt(process.env.EXPIRY_TIME_IN_MINUTES) : 120;
const expiryOffsetMillis = expiryOffsetMinutes * 60 * 1000;
const isSecure = process.env.NODE_ENV === ENV.PRODUCTION;

app.listen(port, function() {
    logger.debug(`Server listening in port ${port}`);
});

app.get('/has-cookie',  function(req, res) {
    try {
        const hasCookie = !!req.cookies && req.cookies.userid;
        let response = {};

        if (hasCookie) {
            response = {
                hasCookie
            };
        }
        res.json(response);
    } catch(error) {
        logger.error(error);
        res.status(500).send();
    }
});

const isValidBundle = (bundle, key, type) => {
    return Object.keys(bundle).length === 1 || bundle.hasOwnProperty(key) || (typeof bundle.hasAcceptedCookie === type);
}

app.post('/chatbot',  async function(req, res) {
    try {
        if (!isValidBundle(req.body, 'hasAcceptedCookie', 'boolean')) {
            return res.status(400).json({});
        }

        const hasAcceptedCookie = req.body.hasAcceptedCookie;
        let userId = req.cookies.userid;
        logger.debug(`hasAcceptedCookie: ${hasAcceptedCookie}`);

        if (hasAcceptedCookie) {
            if (!userId) {
                const expiryDate = new Date( Date.now() + expiryOffsetMillis );

                userId = crypto.randomBytes(4).toString('hex');

                const cookieSettings = { 
                    secure: isSecure,
                    httpOnly: true,
                    path: '/',
                    expires: expiryDate
                };
                logger.debug(`userId: ${userId} and cookieSettings: ${JSON.stringify(cookieSettings)}`);
                res.cookie('userid', userId, cookieSettings);
            }
        }
        const tokenBundle = await directlineClient.generateToken();

        const response = {
            userId: userId || 'default-user',
            userName: 'You',
            connectorToken: tokenBundle.token,
            directLineURI: process.env.DIRECTLINE_ENDPOINT_URI
        };

        const jwtToken = jwt.sign(response, process.env.APP_SECRET);

        res.send(jwtToken);
    } catch(error) {
        logger.error(error);
        res.status(500).send();
    }
});

app.get('*', function(req, res){
    const notFoundPath = path.join(__dirname, '..', 'public', '404.html');
    logger.error(`not found url: ${req.url}`);
    res.status(404).sendFile(notFoundPath);
});