// @ts-check
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const colorize = require('json-colorizer');
const assert = require('assert');
const fetch = require('node-fetch').default;
const log = require('./logger').createLogger('gh_oauth_token.js');

const { API_BASE_URL } = require('./bot_config');

// TO WORKSHOP ATTENDEES:
// ======================
//
// You should not have to touch anything in this file. It deals with
// building and signing the JWT necessary to facilitate OAuth 2.0
// authentication and authorization w/ GitHub.

// The paths of two things that should never be checked into git
const _token_storage_path = path.join(__dirname, 'private', '.secret');
const _private_key_path = path.join(__dirname, 'private', 'gh-app.key');
log.info('token storage path: ' + chalk.yellow(_token_storage_path));
log.info('private key path: ' + chalk.yellow(_private_key_path));
/**
 * @typedef Tok
 * @prop {number} iat
 * @prop {number} exp
 * @prop {string} iss
 * @prop {string} state
 * @prop {string} [token]
 */

/**
 *
 * @param {Date} t
 */
const getJwtTime = t => Math.round(t.getTime() / 1000);

/**
 * Get a token from GitHub.
 * @param {string} app_id
 * @param {string} installation_id
 * @returns {Promise<Tok>}
 */
async function get_token(app_id, installation_id) {
  const token_url = `${API_BASE_URL}/app/installations/${installation_id}/access_tokens`;
  const temp_state = uuid.v4();
  log.debug(`uuid: ${temp_state}`);
  const private_key = get_private_key();
  log.debug(`private key: ...${private_key.substr(30, 40)}...`);
  const now = getJwtTime(new Date());
  log.debug(`current time: ${now}`);
  /**
   * Required params
   * @type {Tok}
   */
  const params = {
    iat: now,
    exp: now + 500,
    iss: app_id,
    state: temp_state
  };
  log.debug(`jwt params: ${JSON.stringify(params)}`);

  try {
    // Create a Json Web Token object with the required params.
    const encoded = jwt.sign(params, private_key, { algorithm: 'RS256' });
    log.debug(`encoded jwt: ${encoded.substr(0, 10)}...`);

    const headers = {
      Accept: 'application/vnd.github.machine-man-preview+json',
      Authorization: `Bearer ${encoded}` // OAuth 2.0
    };

    // Send request to GitHub.
    const response = await fetch(token_url, { headers, method: 'post' });
    if (!response.ok)
      throw new Error(
        `Problem making installation token request (url=${token_url}, status=${
          response.status
        }): ${await response.text()}`
      );
    // Add Installation ID and App ID to the Response before returning it
    const response_json = await response.json();
    log.debug(`response json ${colorize(response_json)}`);
    response_json['installation_id'] = installation_id;
    response_json['app_id'] = app_id;
    log.debug(`returned response json ${colorize(response_json)}`);
    return response_json;
  } catch (exc) {
    throw new Error(`Could get token for App - ${app_id}\n${exc}`);
  }
}

/**
 *
 * @param {Tok} token_json
 */
function store_token(token_json) {
  log.debug(`store_token: ${colorize(JSON.stringify(token_json))}`);
  if (token_json && Object.keys(token_json).length > 0) {
    try {
      if (fs.existsSync(_token_storage_path)) {
        fs.unlink(_token_storage_path);
      }
      fs.writeJSONSync(_token_storage_path, token_json, { spaces: 2 });
    } catch (exc) {
      throw new Error(`Could not write secret file.\n${exc}`);
    }
  } else {
    throw new Error('Invalid (empty) token for app');
  }
}

/**
 * Peek on secret file that has the token, deserialize it and return the dict.
 * @return {Tok}
 */
function peek_app_token() {
  if (!fs.existsSync(_token_storage_path)) return null;
  try {
    log.debug('peek_app_token: reading from ' + _token_storage_path);
    const tok = fs.readJSONSync(_token_storage_path);
    assert(tok, 'Token is present');
    assert(Object.keys(tok).length > 0, 'Token has data');
    log.debug('peek_app_token: ', tok);
    return tok;
  } catch (exc) {
    throw new Error(`Could not read secret file.\n${exc}`);
  }
}

/**
 * Refresh tokens of an individual app
 */
async function refresh_token() {
  try {
    const deserialized_message = peek_app_token();
    const app_id = deserialized_message['app_id'];
    const installation_id = deserialized_message['installation_id'];
    store_token(await get_token(app_id, installation_id));
  } catch (exc) {
    throw new Error(`Could not refresh token.\n${exc}`);
  }
}

/**
 * Retrieve latest token. If expired, refresh it
 * @returns {Promise<string>}
 */
async function retrieve_token() {
  try {
    const deserialized_message = peek_app_token();
    log.debug('deserialized_message from peek_app_token', deserialized_message);
    const expires_at = deserialized_message['expires_at'];
    // Token is good, return it
    if (expires_at && check_expired_time(Date.parse(expires_at))) {
      return deserialized_message['token'];
    } else {
      // Token expired, refresh it
      await refresh_token();
      const deserialized_message = peek_app_token();
      const expires_at = deserialized_message['expires_at'];
      // Token is good, return it
      assert(expires_at && check_expired_time(expires_at));
      return deserialized_message['token'];
    }
  } catch (exc) {
    throw new Error(`Could not refresh token.\n${exc}`);
  }
}

/**
 * Read private key from hidden file and return it
 */
function get_private_key() {
  if (!fs.existsSync(_private_key_path)) {
    return null;
  }
  try {
    if (!fs.existsSync(_private_key_path))
      throw new Error(`No private key found at ${_private_key_path}`);
    return fs.readFileSync(_private_key_path).toString();
  } catch (exc) {
    throw new Error(
      `Could not read private key from "${_private_key_path}".\n${exc}`
    );
  }
}

/**
 * Given a DateTime string, check if that time has expired while taking into account the buffer time.
 * @param {number} time
 * @param {number} buffer
 */
function check_expired_time(time, buffer = 300) {
  return time > getJwtTime(new Date()) + buffer;
}

module.exports = { retrieve_token, get_token, store_token };
