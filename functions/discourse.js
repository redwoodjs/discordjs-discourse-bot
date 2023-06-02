const https = require("node:https");
const { discourseHostname, discourseApiKey, discourseApiUsername } = require("../config.json");

// Discourse API Resource: https://docs.discourse.org/

// Path will be dynamic based on post response
// Path should correspond with API
// Etc. /admin/groups; /t/{id}; /latest
const DISCOURSE_API_ENDPOINT = "/posts";
const CATEGORY_ID = 22;

/**
 * Formats the title to meet Discourse's requirements
 * @param {string} title - the original title
 * @returns {string} - the formatted title
 */
function formatTitle(title) {
  if (title.length > 255) {
    title = title.substring(0, 255);
  }
  if (title.length < 20) {
    title = title.padEnd(20, "_")
  }

  return title.replace(/-/g, "").replace(/’/g, "'");
}

/**
 * Makes a post request to the Discourse API
 * @param {object} message - the message to post
 * @param {string} message.title - the title of the post
 * @param {string} message.raw - the raw content of the post
 */
function discoursePost(message) {
  const data = {
    title: formatTitle(message.title),
    raw: message.raw,
    category: CATEGORY_ID
  };

  const postData = JSON.stringify(data).replace(/-/g, "").replace(/’/g, "'");

  const options = {
    hostname: discourseHostname,
    port: 443,
    path: DISCOURSE_API_ENDPOINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      "Api-Key": discourseApiKey,
      "Api-Username": discourseApiUsername,
    },
  };

  const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
      process.stdout.write(d);
    });
  });

  req.on('error', error => {
    console.error(error);
  });

  req.write(postData);
  req.end();
}

module.exports = { discoursePost };
