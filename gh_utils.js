// @ts-check
const fetch = require('node-fetch').default;
const base64 = require('base-64');
const log = require('./logger').createLogger('./gh_utils.js');

const { GH_USER, GH_USER_TOKEN, API_BASE_URL } = require('./bot_config');
/**
 *
 * Send API call to Github using a personal token.
 *
 * Use this function to make API calls to the GitHub REST api
 *
 * @param {string} path API path
 * @param {'GET'|'POST'|'PUT'|'DELETE'} verb HTTP verb
 * @param {*} data
 *
 * @example
 * // `GET` the current user
 * me = make_github_rest_api_call('login')
 *
 * // `POST` to create a comment on a PR
 * new_comment = make_github_rest_api_call(
 *  'repos/my_org/my_repo/issues/31/comments',
 *  'POST', {
 *    'body': "Hello there, thanks for creating a new Pull Request!"
 *   }
 * );
 */
async function make_github_rest_api_call(path, verb = 'GET', data = null) {
  const url = `${API_BASE_URL}/${path}`;
  const headers = {
    'Accept': 'application/vnd.github.antiope-preview+json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${base64.encode(GH_USER + ':' + GH_USER_TOKEN)}`
  };
  const opts = {
    headers,
    method: verb
  };
  if (data) {
    opts.body = JSON.stringify(data);
  }
  log.info(`making ${verb} request to ${url}`);
  const resp = await fetch(url, opts);
  if (!resp.ok) {
    throw new Error(
      `Problem making API call ${verb} ${url}\n${JSON.stringify(
        data,
        null,
        '  '
      )}\n${await resp.text()}`
    );
  }
  return await resp.json();
}

module.exports = { make_github_rest_api_call };
