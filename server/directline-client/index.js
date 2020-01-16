const rp = require('request-promise');
const jwt = require('jsonwebtoken');

class DirectlineClient {
   constructor(secret) {
      this.secret = secret;
   }

   async generateJwtToken(userId) {
      const tokenBundle = await this.requestRemoteToken();

      const response = {
          userId: userId || 'default-user',
          userName: 'You',
          connectorToken: tokenBundle.token,
          directLineURI: process.env.DIRECTLINE_ENDPOINT_URI
      };

      return jwt.sign(response, process.env.APP_SECRET);
   }

   requestRemoteToken() {
      const options = {
         method: 'POST',
         uri: 'https://europe.directline.botframework.com/v3/directline/tokens/generate',
         headers: {
             'Authorization': 'Bearer ' + this.secret
         },
         json: true
     };

     return rp(options);
   }
}

module.exports = DirectlineClient;