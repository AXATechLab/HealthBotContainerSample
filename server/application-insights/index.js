const startAppInsights = () => {
   const instrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

   if (!instrumentationKey) {
       throw new Error('Please, add instrumentation key as env var');
   }
   const appInsights = require('applicationinsights');

   appInsights.setup(instrumentationKey);
   appInsights.start();
};

module.exports = startAppInsights;