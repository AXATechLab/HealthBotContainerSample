const path = require('path');

const DirectlineClient = require('../directline-client');
const setupCookie = require('../cookies/cookie-helper');
const Logger = require('../logger');

const logger = Logger.getLogger();

const isValidBundle = (bundle, key, type) => {
   return Object.keys(bundle).length === 1 || bundle.hasOwnProperty(key) || (typeof bundle.hasAcceptedCookie === type);
};

const directlineClient = new DirectlineClient(process.env.WEBCHAT_SECRET);

module.exports = (app) => {
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
  
  app.post('/chatbot',  async function(req, res) {
      try {
          if (!isValidBundle(req.body, 'hasAcceptedCookie', 'boolean')) {
              return res.status(400).json({});
          }
          const hasAcceptedCookie = req.body.hasAcceptedCookie;
          let userId = req.cookies.userid;
          logger.debug(`hasAcceptedCookie: ${hasAcceptedCookie}`);
  
          if (hasAcceptedCookie && !userId) {
              userId = setupCookie(res);
          }
          const token = await directlineClient.generateJwtToken(userId);
  
          res.send(token);
      } catch(error) {
          logger.error(error);
          res.status(500).send();
      }
  });
  
  app.get('*', function(req, res){
      const notFoundPath = path.join(__dirname, '..', '..', 'public', '404.html');
      logger.error(`not found url: ${req.url}`);
      res.status(404).sendFile(notFoundPath);
  });
};
