const express = require('express');
const bodyParser = require('body-parser');
const { createLogger, logWebhookPayload } = require('./logger');
// const debounce = require('debounce');
const { make_github_rest_api_call } = require('./gh_utils');

const log = createLogger('./app.js');

// use port 5000 unless told otherwise by PORT env variable
if (typeof process.env.PORT === 'undefined') process.env.PORT = 5000;

// application entry point
async function main() {
  // create an app
  const app = express();

  // parse incoming request bodies as JSON
  app.use(bodyParser.json());

  // webhook receiver function
  app.post('/webhook', async function(req, resp) {
    logWebhookPayload(log, req);
    console.log("header: ", req.header("x-github-event"));
    console.log("body.action: ", req.body.action);
    console.log("body.issue.comments_url: ", req.body.issue.comments_url);
    
  });

  // start the app
  app.listen(process.env.PORT, function() {
    log.info('Listening on http://localhost:5000');
  });
}

main();
