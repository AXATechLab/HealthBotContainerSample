require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
    if (!process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
        throw new Error('Please, add instrumentation key as env var');
    }
    const appInsights = require('applicationinsights');

    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
    appInsights.start();
}

const helmet = require('helmet')
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const rp = require('request-promise');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }));
app.use(bodyParser.json());
app.use(errorHandler);
app.use(express.static(path.join(__dirname, '..', 'public')));

function errorHandler(err, req, res, next) {
    res.status(500);
    res.status(500).send();
}

const port = process.env.PORT || 3000;
const expiryOffsetMinutes = process.env.EXPIRY_TIME_IN_MINUTES ? parseInt(process.env.EXPIRY_TIME_IN_MINUTES) : 120;
const expiryOffsetMillis = expiryOffsetMinutes * 60 * 1000;
const isSecure = process.env.NODE_ENV === 'development' ? false : true;

app.listen(port, function() {
    console.log('Server started...');
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
        console.log('request error ', error);
        res.status(500).send();
    }
});

const isValidBundle = (bundle, key, type) => {
    return Object.keys(bundle).length === 1 || bundle.hasOwnProperty(key) || (typeof bundle.hasAcceptedCookie === type);
}

app.post('/chatbot',  async function(req, res) {
    try {
        const options = {
            method: 'POST',
            uri: 'https://europe.directline.botframework.com/v3/directline/tokens/generate',
            headers: {
                'Authorization': 'Bearer ' + process.env.WEBCHAT_SECRET
            },
            json: true
        };
        if (!isValidBundle(req.body, 'hasAcceptedCookie', 'boolean')) {
            return res.status(400).json({});
        }

        const hasAcceptedCookie = !!req.body.hasAcceptedCookie;
        const parsedBody = await rp(options);
        let userId = req.cookies.userid;

        if (hasAcceptedCookie) {
            if (!userId) {
                const expiryDate = new Date( Date.now() + expiryOffsetMillis );
    
                userId = crypto.randomBytes(4).toString('hex');
                res.cookie('userid', userId, { 
                    secure: isSecure,
                    httpOnly: true,
                    path: '/',
                    expires: expiryDate
                    });
            }
        }

        const response = {
            userId: userId || 'default-user',
            userName: 'You',
            connectorToken: parsedBody.token,
            directLineURI: process.env.DIRECTLINE_ENDPOINT_URI
        };

        const jwtToken = jwt.sign(response, process.env.APP_SECRET);
        res.send(jwtToken);
    } catch(error) {
        console.log('request error ', error);
        res.status(500).send();
    }
});

app.get('*', function(req, res){
    const notFoundPath = path.join(__dirname, '..', 'public', '404.html');

    res.status(404).sendFile(notFoundPath);
});