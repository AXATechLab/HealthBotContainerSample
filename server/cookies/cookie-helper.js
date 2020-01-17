const crypto = require('crypto');

const { ENV } = require('../constants');
const Logger = require('../logger');

const logger = Logger.getLogger();

const expiryOffsetMinutes = process.env.EXPIRY_TIME_IN_MINUTES ? parseInt(process.env.EXPIRY_TIME_IN_MINUTES) : 120;
const expiryOffsetMillis = expiryOffsetMinutes * 60 * 1000;
const isSecure = process.env.NODE_ENV === ENV.PRODUCTION;

const generateUserId = () => crypto.randomBytes(8).toString('hex');
const generateCookie = (res, userId) => {
   const expiryDate = new Date( Date.now() + expiryOffsetMillis );
   const cookieSettings = { 
      secure: isSecure,
      httpOnly: true,
      path: '/',
      expires: expiryDate
   };
   logger.debug(`userId: ${userId} and cookieSettings: ${JSON.stringify(cookieSettings)}`);
   res.cookie('userid', userId, cookieSettings);
};

const setupCookie = res => {
   const userId = generateUserId();

   generateCookie(res, userId);

   return userId;
};

module.exports = setupCookie;