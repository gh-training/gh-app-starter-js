const winston = require('winston');
const chalk = require('chalk');
const leftPad = require('left-pad');

const PARENT_LOGGER = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.metadata(),
    winston.format.timestamp({ format: 'HH:mm:ss.SS', colorize: true }),
    winston.format.printf(
      ({ level, message, metadata: { fileName }, timestamp }) => {
        return `[${chalk.dim(timestamp)}][${leftPad(level, 8)}][${chalk.cyan(
          leftPad(`./${fileName}`, 12)
        )}] ${message}`;
      }
    )
  ),
  transports: [new winston.transports.Console()]
});
module.exports = fileName => PARENT_LOGGER.child({ fileName });
