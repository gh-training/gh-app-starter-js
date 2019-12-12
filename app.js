const express = require('express');
const bodyParser = require('body-parser');
const log = require('./logger')('index.js');
const debounce = require('debounce');

const { make_github_rest_api_call } = require('./gh_utils');

const app = express();

app.use(bodyParser.json());

const debouncedCreateOrUpdateComment = debounce(
  createOrUpdateComment,
  250,
  false
);
app.post('/webhook', async function(req, resp) {
  const {
    repository: {
      name: repo,
      owner: { login: owner }
    },
    issue: { number: issueNumber }
  } = req.body;
  await debouncedCreateOrUpdateComment(
    { repo, owner, issueNumber },
    { marker: 'MY_SPECIAL_BOT' },
    'The time is ' + new Date().toISOString()
  );
});

app.listen(process.env.PORT || 5000, function() {
  log.info('Listening on http://localhost:5000');
});

/**
 *
 * @param {{ repo: string, owner: string, issueNumber: number}} param0
 * @param {{ marker: string}} param1
 * @param {string} body
 */
async function createOrUpdateComment(
  { repo, owner, issueNumber },
  { marker },
  body
) {
  const token = `<!-- ${marker} -->`;
  const comments = await make_github_rest_api_call(
    `repos/${owner}/${repo}/issues/${issueNumber}/comments`
  );
  const [match] = comments.filter(comment => comment.body.indexOf(token) >= 0);
  if (match) {
    await make_github_rest_api_call(
      `repos/${owner}/${repo}/issues/comments/${match.id}`,
      'PATCH',
      {
        body: `${body}
${token}`
      }
    );
  } else {
    await make_github_rest_api_call(
      `repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      'POST',
      {
        body: `${body}
${token}`
      }
    );
  }
}
