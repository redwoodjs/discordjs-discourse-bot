# background

zOMG I've wanted this, like, forever
I've never considered moving Discord Threads to Discourse Posts... TBD
But I'd love to see three Bot capabilities:
1. Command to "post" a message or thread to the Forums

Lots of times there's a helpful code snippet or thread that we want to "archive" in the Forums for Knowledge Base purposes. Could a bot command do this seemlessly?
2. Move a conversation to the Forums
Instead of creating threads here or having an ongoing conversation, what if there was a simple way to "move" a conversation over to the Forums and continue from there? 
- bot prompts
- command to copy/paste/create Forum post and gives back the link
3. Search the Forums
I've dreamed of a command that would let you search the forums (word or phrase) and return the top 5 results with link to "view all" on the Forums


# discordjs-discourse-bot


## Discord to Discourse Bot

Creates message menu button to send to discourse

Generates three buttons: Submit Message, Submit Thread/Channel, Select Message

Fetches messages based on button click

Sends to Discourse Plugin 

(https://github.com/discourse/discourse-prometheus-alert-receiver)?

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

# Ideas

Data Explorer Queries: https://meta.discourse.org/t/how-to-run-data-explorer-queries-with-the-discourse-api/120063

> Virtually any action that can be performed through the Discourse user interface can also be triggered with the Discourse API. For a general overview of how to find the correct API request for an action, see How to reverse engineer the Discourse API 70.

Official Direct SQL Access API for Discourse: https://meta.discourse.org/t/new-official-direct-sql-access-api-for-discourse-mini-sql/90441

