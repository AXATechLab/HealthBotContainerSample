require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
    if (!process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
        throw new Error('Please, add instrumentation key as env var');
    }
    const appInsights = require("applicationinsights");

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

const app = express();

app.use(helmet());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
const expiryOffsetMinutes = process.env.EXPIRY_TIME_IN_MINUTES ? parseInt(process.env.EXPIRY_TIME_IN_MINUTES) : 120;
const expiryOffsetMillis = expiryOffsetMinutes * 60 * 1000;
const isSecure = process.env.NODE_ENV === 'development' ? false : true;

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});

app.get('/chatBot',  function(req, res) {
    const options = {
        method: 'POST',
        uri: 'https://europe.directline.botframework.com/v3/directline/tokens/generate',
        headers: {
            'Authorization': 'Bearer ' + process.env.WEBCHAT_SECRET
        },
        json: true
    };
    rp(options).then(function (parsedBody) {
        let userId = req.cookies.userid;
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

        const response = {
            userId,
            userName: req.query.userName,
            connectorToken: parsedBody.token,
            directLineURI: process.env.DIRECTLINE_ENDPOINT_URI
        };

        const jwtToken = jwt.sign(response, process.env.APP_SECRET);
        res.send(jwtToken);
    }).catch(function (err) {
        console.error('err -> ', err);
        res.status(err.statusCode).send();
        console.log('failed');
    });
});

app.get('*', function(req, res){
    const notFoundPath = path.join(__dirname, 'public', '404.html');
    res.status(404).sendFile(notFoundPath);
});