## Discord to Discourse Bot

Creates message menu button to send to discourse

Generates three buttons: Submit Message, Submit Thread/Channel, Select Message

Fetches messages based on button click

Sends to Discourse Plugin 

(https://github.com/discourse/discourse-prometheus-alert-receiver)?

Posts to Discourse topic

## How to run:

Clone repo > `yarn install`

See these instructions to set up `config.json` & get `token`: https://discordjs.guide/creating-your-bot/#creating-configuration-files

And find where to get `guildId` and `clientId` from: https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script

> TIP
>
> In order to get your application's client id, go to Discord Developer Portal and choose your application. Find the id under "Application ID" in General Information subpage. To get guild id, open Discord and go to your settings. On the "Advanced" page, turn on "Developer Mode". This will enable a "Copy ID" button in the context menu when you right-click on a server icon, a user's profile, etc.

Set up `config.json` file with these three tokens:

```
{
    "clientId": "",
	"guildId": "",
	"token": ""

	"hostname": "",
    "apiKey": "",
    "apiUsername": ""
}
```

To register menu command:

run: `node deploy-commands.js`

To run bot & accept incoming commands:

run: `node index.js`

# Work In Progress

~~**To-Do**: Create discourse plugin to accept message and post to topic~~

**To-Do**: Convert to ES6?/RW

**Cleanup**: Fetch all messages function can be cleaner

**Cleanup**: Generally refactor the code into better practices 

**Bugs**: Selecting in thread throws error

# Ideas

Data Explorer Queries: https://meta.discourse.org/t/how-to-run-data-explorer-queries-with-the-discourse-api/120063

> Virtually any action that can be performed through the Discourse user interface can also be triggered with the Discourse API. For a general overview of how to find the correct API request for an action, see How to reverse engineer the Discourse API 70.

Official Direct SQL Access API for Discourse: https://meta.discourse.org/t/new-official-direct-sql-access-api-for-discourse-mini-sql/90441


Check errors & Report: 

statusCode: 422
{"action":"create_post","errors":["Title has already been used"]}
