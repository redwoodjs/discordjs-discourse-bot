const { Collection } = require("discord.js")

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		// Set up messages collection on client to push to
		const messages = new Collection();
		client.messages = messages

		// Set up messages collection on client to push to
		const selectMessages = new Collection();
		client.selectMessages = selectMessages
	},
};
