const {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} = require("discord.js");

const discoursePost = require("../functions/discourse.js").discoursePost;

// QUESTION unsure if passing client as prop is necessary

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // *********************
    // Menu & Button Setters
    // *********************

    // Button Setup on Message Menu 'Discourse Submit' Selection

    if (interaction.commandName === "Discourse Submit") {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("messageSubmit")
          .setLabel("Submit this Message")
          .setStyle("PRIMARY"),

        new MessageButton()
          .setCustomId("channelSubmit")
          .setLabel("Submit this Thread/Channel")
          .setStyle("PRIMARY"),

        new MessageButton()
          .setCustomId("selectMessages")
          .setLabel("Select Messages")
          .setStyle("PRIMARY")
      );

      let message = "";
      let user = "";

      messages = [];

      const channel = client.channels.cache.get(interaction.channelId);
      await channel.messages.fetch(interaction.targetId).then((m) => {
        user = m.author.username;
        message = m.content;
        messages = { title: message, raw: user + "\n" + message };
      });

      const embed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle(user)
        .setDescription(message);

      await interaction.reply({
        content: "Send message(s) to discourse topic.",
        ephemeral: true,
        embeds: [embed],
        components: [row],
      });
    }

    // *********************
    // Button Functions
    // *********************

    // Submit selected messages if 'Submit this Message' button is clicked

    if (interaction.customId == "messageSubmit") {
      discoursePost(messages);
    }

    // Submit all messages if 'Submit All' button is clicked

    if (interaction.customId == "channelSubmit") {
      let result = await fetchThreadMessages(interaction.channelId);

      if (result) {
        messages = {
          title: "",
          raw: "",
        };

        messages.title = client.messages.first().content;
        client.messages.forEach((m) => {
          messages.raw += "**" + m.username + "**\n";
          messages.raw += m.content + "\n";
          messages.raw += "\n";
        });

        discoursePost(messages);
      }
    }

    // Build message selectors if 'Select Messages' button is clicked
    if (interaction.customId == "selectMessages") {
      let result = await fetchThreadMessages(interaction.channelId);

      if (result) {
        // May want to use a Collector() object for options instead of array
        options = [];
        client.messages.forEach((m) => {
          let object = {};
          object.label = m.username;
          object.description = limit(m.content, 100);
          object.value = m.id;
          options.push(object);
        });

        // Truncate message to 25;
        // Expand this to multiple select menus to allow for more message history selection
        if (options.length > 25) {
          options.length = 25;
        }

        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("select")
            .setPlaceholder("Nothing selected")
            .setMinValues(1)
            .setMaxValues(options.length)
            .addOptions(
              options.map((item) => {
                return {
                  label: item.label,
                  description: item.description,
                  value: item.value,
                };
              })
            )
        );

        interaction.reply({
          content: "Select messages",
          ephemeral: true,
          components: [row],
        });
      }
    }

    // *********************
    // Select Menu Functions
    // *********************

    // Catch selected message Ids, compose messages, send to Discourse
    if (interaction.isSelectMenu()) {
      messages = {
        title: "",
        raw: "",
      };

      messages.title = client.messages.get(interaction.values[0]).content;
      interaction.values.forEach((m) => {
        message = client.messages.get(m);
        messages.raw += "**" + message.username + "**\n";
        messages.raw += message.content + "\n";
        messages.raw += "\n";
      });

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("abortSubmission")
          .setLabel("Abort Submission")
          .setStyle("DANGER"),

        new MessageButton()
          .setCustomId("submitSelected")
          .setLabel("Submit")
          .setStyle("PRIMARY")
      );

      client.selectMessages.set(1, messages);

      await interaction.reply({
        content:
          "Your Discourse topic will look like the following: \n \n" +
          messages.raw,
        ephemeral: true,
        components: [row],
      });
    }

    if (interaction.customId == "submitSelected") {
      // Should this be async, and then run a .clear() function on collection after returns true?
      discoursePost(client.selectMessages);
    }

    if (interaction.customId == "abortSubmission") {
      client.messages.clear();
      client.selectMessages.clear();

      await interaction.reply({
        content: "Message submission aborted and cleared.",
        ephemeral: true,
      });
    }

    // *********************
    // Other Functions
    // *********************

    // String limiter (100 for Select Menu)
    function limit(string = "", limit = 0) {
      return string.substring(0, limit);
    }

    // Fetch starter message from thread

    async function getThreadStarter(msg) {
      const chan = client.channels.cache.get(msg.reference.channelId);
      const mess = await chan.messages.fetch(msg.reference.messageId);
      return mess;
    }

    // Format message content for posts
    function formatMessage(msg) {
      fMessage = {};
      fMessage.content = msg.content;
      fMessage.username = msg.author.username;
      fMessage.createdTimestamp = msg.createdTimestamp;
      fMessage.id = msg.id;

      return fMessage;
    }

    // fetch over 100 function taken from: https://stackoverflow.com/a/71620968
    // pointer is updated in message (while) loop

    async function fetchThreadMessages(channelId) {
      const channel = client.channels.cache.get(channelId);

      if (channel.isThread()) {
        threadName = channel.name;
      }

      // Create message pointer
      // Fetches first message
      // Then fetches messages before that message

      let message = await channel.messages
        .fetch({ limit: 1 })
        .then((messagePage) =>
          messagePage.size === 1 ? messagePage.at(0) : null
        );

      var mDetail = formatMessage(message);
      client.messages.set(mDetail.id, mDetail);

      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then((messagePage) => {
            messagePage.forEach((msg) => {
              // this has issues (i believe) with starter messages that have been edited 
              if (msg.type == "THREAD_STARTER_MESSAGE") {
                getThreadStarter(msg).then((m) => {
                  mDetail = formatMessage(m);
                  // ideally this would be below; after the else... but it doesn't work unless here (promises...)
                  client.messages.set(mDetail.id, mDetail);
                });
              } else {
                mDetail = formatMessage(msg);
              }
              if (mDetail.id) {
                client.messages.set(mDetail.id, mDetail);
              }
            });
            // Update our message pointer to be last message in page of messages
            message =
              0 < messagePage.size
                ? messagePage.at(messagePage.size - 1)
                : null;
          });
      }

      client.messages.sort();
      return true;
    }

    // Fetch all messages & return author, content, id and timestamp
    // Function skeleton taken from stack overflow answer.
    // Same as above; should be removed? Is being used for select option
    // archived currently; should be removed...

    async function fetchAllMessages(channelId) {
      const channel = client.channels.cache.get(channelId);

      if (channel.isThread()) {
        threadName = channel.name;
      }

      // Create message pointer
      let message = await channel.messages
        .fetch({ limit: 1 })
        .then((messagePage) =>
          messagePage.size === 1 ? messagePage.at(0) : null
        );

      var mDetail = formatMessage(message);
      client.messages.set(mDetail.id, mDetail);

      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then((messagePage) => {
            messagePage.forEach((msg) => {
              if (msg.type == "THREAD_STARTER_MESSAGE") {
                getThreadStarter(msg).then((m) => {
                  mDetail = formatMessage(m);
                  client.messages.set(mDetail.id, mDetail);
                });
              } else {
                mDetail = formatMessage(msg);
              }
              client.messages.set(mDetails.id, mDetails);
            });
            // Update our message pointer to be last message in page of messages
            message =
              0 < messagePage.size
                ? messagePage.at(messagePage.size - 1)
                : null;
          });
      }

      return true;
    }
  },
};
