const winston = require('winston');
const chalk = require('chalk');
const leftPad = require('left-pad');
const colorize = require('json-colorizer');

const PARENT_LOGGER = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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

const createLogger = fileName => PARENT_LOGGER.child({ fileName });

const TIP_TEXT = chalk.cyan(
  `\nTIP: to see webhook data, set ${chalk.yellow(
    'LOG_LEVEL = debug'
  )} in your ${chalk.yellow('.env')} file and restart your app`
);
let lastTip = -1;
/**
 *
 * @param {winston.Logger} log
 * @param {express.Request} req
 */
function logWebhookPayload(log, req) {
  /**
   * Show the tip about log levels and webhook payloads
   * no more than once per 60 seconds
   */
  let now = Date.now();
  let tip = '';
  if (process.env.LOG_LEVEL !== 'debug' && now - lastTip > 60000) {
    lastTip = now;
    tip = TIP_TEXT;
  }
  log.info(
    `received webhook (event=${chalk.yellow(
      req.header('X-GitHub-Event')
    )}, action=${chalk.yellow(req.body.action)})${tip}`
  );
  log.debug(colorize(JSON.stringify(req.body, null, '  ')));
}

module.exports = { createLogger, logWebhookPayload };
