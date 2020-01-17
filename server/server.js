require('dotenv').config();

const helmet = require('helmet')
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')

const { SECURITY } = require('./settings');
const loadRoutes = require('./routes');
const { ENV } = require('./constants');
const startAppInsights = require('./application-insights');
const Logger = require('./logger');

const logger = Logger.getLogger();
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === ENV.PRODUCTION) {
    startAppInsights();
}

const app = express();

app.use(helmet());
app.use(helmet.contentSecurityPolicy(SECURITY.CSP_POLICY));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(errorHandler);
app.use(express.static(path.join(__dirname, '..', 'public')));

function errorHandler(err, req, res, next) {
    res.status(500).send();
}

loadRoutes(app);

app.listen(port, function() {
    logger.debug(`Server listening in port ${port}`);
});
