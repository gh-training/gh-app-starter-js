const log = require('./logger').createLogger('bot-config.js');
/**
 * SECRETS & CONFIG
 * =================
 * The following values come from your .env file, and either pertain to
 * your app's configuration (i.e., API_BASE_URL) or are secrets that may
 * have different values for each environment (staging, prod)
 *
 * You'll get warnings if any of these are unset
 */

const GH_USER = process.env.GH_USER || '';
const GH_USER_TOKEN = process.env.GH_USER_TOKEN || '';
const API_BASE_URL = process.env.API_BASE_URL || '';
const GH_APP_ID = process.env.GH_APP_ID || '';
const GH_APP_CLIENT_ID = process.env.GH_APP_CLIENT_ID || '';
const GH_APP_CLIENT_SECRET = process.env.GH_APP_CLIENT_SECRET || '';
const GH_APP_PRIVATE_KEY_PATH = process.env.GH_APP_PRIVATE_KEY_PATH || '';

const env_vars = {
  GH_USER: GH_USER,
  GH_USER_TOKEN: GH_USER_TOKEN,
  API_BASE_URL: API_BASE_URL,
  GH_APP_ID: GH_APP_ID,
  GH_APP_CLIENT_ID: GH_APP_CLIENT_ID,
  GH_APP_CLIENT_SECRET: GH_APP_CLIENT_SECRET,
  GH_APP_PRIVATE_KEY_PATH: GH_APP_PRIVATE_KEY_PATH
};
function validate_env_variables() {
  const blanks_msg = Object.keys(env_vars)
    .map(k => [k, env_vars[k]])
    .reduce((acc, item) => {
      if (item[1].trim() === '') return `${acc}\n - ${item[0]}`;
      else return acc;
    }, '');
  log.warn(
    'Preflight check warning:\nThe following environment variables were found to be empty...\n' +
      blanks_msg +
      "\n\nThis may be fine, depending on which exercise you're on"
  );
}

module.exports = {
  validate_env_variables,
  GH_USER,
  GH_USER_TOKEN,
  API_BASE_URL,
  GH_APP_ID,
  GH_APP_CLIENT_ID,
  GH_APP_CLIENT_SECRET,
  GH_APP_PRIVATE_KEY_PATH
};
