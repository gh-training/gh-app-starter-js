// @ts-check

const fs = require('fs-extra');
const express = require('express');
const bodyParser = require('body-parser');
const { createLogger, logWebhookPayload } = require('./logger');
const {
  store_token,
  get_token
} = require('./prepared-resources/gh_oauth_token');
const { make_github_rest_api_call } = require('./gh_utils');
const { GH_APP_ID } = require('./bot_config');
const debounce = require('debounce');

const log = createLogger('./app.js');

// use port 5000 unless told otherwise by PORT env variable
if (typeof process.env.PORT === 'undefined') process.env.PORT = '5000';

const debouncedApiCall = debounce(make_github_rest_api_call, 500);

// application entry point
async function main() {
  // create an app
  const app = express();

  // parse incoming request bodies as JSON
  app.use(bodyParser.json());

  /**
   * Incoming Installation Request. Accept and get a new token.
   */
  app.get('/authenticate', async (req, res) => {
    try {
      const installation_id = req.query['installation_id'];
      store_token(await get_token(GH_APP_ID, installation_id));
      return res.status(302).redirect('https://www.github.com');
    } catch (exp) {
      throw new Error(`Unable to get and store token\n${exp}`);
    }
  });
  // webhook receiver function
  app.post('/webhook', async function(req, resp) {
    logWebhookPayload(log, req);
    if (req.body.sender && req.body.sender.type === 'Bot') {
      log.info(
        `🤖 IGNORING webhook event originating from bot activity (sender=${req.body.sender.login})`
      );
      return;
    }
    await debouncedApiCall(
      'repos/gh-training/gh-training.github.io/issues/1',
      'PATCH',
      {
        body: 'ABC'
      }
    );
  });

  // start the app
  app.listen(process.env.PORT, function() {
    log.info('Listening on http://localhost:5000');
  });
}

main();
