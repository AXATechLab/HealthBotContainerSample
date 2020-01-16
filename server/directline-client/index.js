const rp = require('request-promise');

class DirectlineClient {
   constructor(secret) {
      this.secret = secret;
   }

   generateToken() {
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