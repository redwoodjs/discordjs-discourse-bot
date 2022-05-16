# discordjs-discourse-bot

## Discord to Discourse Bot

Creates message menu button to send to discourse

Generates three buttons: Submit Message, Submit Thread/Channel, Select Message

Fetches messages based on button click

Sends to Discourse Plugin

Posts to Discourse topic

## How to run:

Clone repo > `yarn install`

See these instructions to set up `config.json`: https://discordjs.guide/creating-your-bot/#creating-configuration-files

And find where to get `guildId` and `clientId` from: https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script

Set up `config.json` file with these three tokens:

```
{
    "clientId": "",
	"guildId": "",
	"token": ""
}
```

To register menu command:

run: `node deploy-commands.js`

To run bot & accept incoming commands:

run: `node index.js`

# Work In Progress

**To-Do**: Create discourse plugin to accept message and post to topic

**To-Do**: Send function has not been fleshed out

**Cleanup**: Fetch all messages function can be cleaner

**Cleanup**: Generally refactor the code into better practices 

**Bugs**: Selecting in thread throws error
