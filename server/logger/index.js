const pino = require('pino');

const { ENV } = require('../constants');

let defaultLogger = null;

class Logger {
	static getLogger() {
		if (!defaultLogger) {
			const logLevel = process.env.LOG_LEVEL || 'info';
			const currentEnv = process.env.NODE_ENV;
			const prettySettings = {
				colorize: true,
				translateTime: true
			};
			const settings = {
				prettyPrint: currentEnv !== ENV.PRODUCTION ? prettySettings : false,
				level: logLevel
			};
			defaultLogger = pino(settings);
			defaultLogger.info(`Log level: ${logLevel}`);
		}
		return defaultLogger;
	}
}

module.exports = Logger;
