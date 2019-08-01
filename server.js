require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const rp = require('request-promise');
const cookieParser = require('cookie-parser');

// Initialize the web app instance,
const app = express();
app.use(cookieParser());
// Indicate which directory static resources
// (e.g. stylesheets) should be served from.
app.use(express.static(path.join(__dirname, 'public')));
// begin listening for requests.
const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});

function isUserAuthenticated(){
    // add here the logic to verify the user is authenticated
    return true;
}

app.get('/chatBot',  function(req, res) {
    if (!isUserAuthenticated()) {
        res.status(403).send();
        return
    }
    const options = {
        method: 'POST',
        uri: 'https://directline.botframework.com/v3/directline/tokens/generate',
        headers: {
            'Authorization': 'Bearer ' + process.env.WEBCHAT_SECRET
        },
        json: true
    };
    rp(options).then(function (parsedBody) {
        let userId = req.query.userId || req.cookies.userid;
        if (!userId) {
            userId = crypto.randomBytes(4).toString('hex');
            res.cookie('userid', userId);
        }

        const response = {
            userId,
            userName: req.query.userName,
            connectorToken: parsedBody.token,
            /*
            optionalAttributes: {
                age: 33
            }, 
            */
            directLineURI: process.env.DIRECTLINE_ENDPOINT_URI
        };

        if (req.query.lat && req.query.long)  {
            response.location = { lat: req.query.lat, long: req.query.long };
        }
        const jwtToken = jwt.sign(response, process.env.APP_SECRET);
        res.send(jwtToken);
    }).catch(function (err) {
        console.error('err -> ', err);
        res.status(err.statusCode).send();
        console.log('failed');
    });
});