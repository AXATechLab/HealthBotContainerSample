const Logger = require('../logger');

const logger = Logger.getLogger();

const defaultCspPolicy = {
   directives: {
       defaultSrc: ["'self'"],
       styleSrc: ["'self'", "'unsafe-inline'"],
       imgSrc: ["'self'", 'data:', 'https://mediktor-ppa.azure-rev-poc.com', 'https://mediktor-dva.azure-rev-poc.com', 'https://webchat-pra.azure-rev-poc.com/'],
       connectSrc: ["'self'", 'ws://directline.botframework.com', 'https://directline.botframework.com']
   }
};

const defaultCorsPolicy = {
   methods: 'GET,OPTIONS,POST',
   origin: '*'
};

const isValidJson = input => {
   let isValid = false;

   if (input) {
      try {
         JSON.parse(input);
         isValid = true;
      } catch(error) {
         logger.error('invalid json: ' + input);
      }
   }
   return isValid;
}

let CSP_POLICY = defaultCspPolicy;

if (isValidJson(process.env.CSP_POLICY)) {
   CSP_POLICY = JSON.parse(process.env.CSP_POLICY);
   logger.debug(`Loading custom csp policy settings: ${JSON.stringify(CSP_POLICY, null, 2)}`);
}

let CORS_POLICY = defaultCorsPolicy;

if (isValidJson(process.env.CORS_POLICY)) {
   CORS_POLICY = JSON.parse(process.env.CORS_POLICY);
   logger.debug(`Loading custom cors policy settings: ${JSON.stringify(CORS_POLICY, null, 2)}`);
}

module.exports = {
   SECURITY: {
      CSP_POLICY,
      CORS_POLICY,
      BODY_SIZE_LIMIT: '1mb'
   }
};