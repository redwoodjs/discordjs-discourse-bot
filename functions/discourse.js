const https = require("node:https");
const { hostname, apiKey, apiUsername } = require("../config.json");

// Discourse API Resource: https://docs.discourse.org/

// Path will be dynamic based on post response
// Path should correspond with API
// Etc. /admin/groups; /t/{id}; /latest
const path = "/posts";

// Data will be request object? sent from function
function discoursePost(message) {
  // Basic Nodejs http post implementation: https://nodejs.dev/learn/making-http-requests-with-nodejs
  // Set options as needed; ex port: 3000

  // This will be formatted from the message object passed to it;
  // Post bodies have to be 20 characters minimum;
  // Will need to write a validator for length.
  // This version of the project will stop here; 
  // Next leg of dev will be refactoring and writing in Redwood on API side;
  // Then will pick up here
  var data = {
    title: message.title,
    raw: message.raw,
    category: 22
  };

  console.log(data)
  console.log(message)
  data = JSON.stringify(data);

  const options = {
    hostname: hostname,
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      "Api-Key": apiKey,
      "Api-Username": apiUsername,
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
  
  req.write(data);
  req.end();

}

module.exports = { discoursePost };
