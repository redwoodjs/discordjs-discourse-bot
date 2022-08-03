const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  SelectMenuBuilder,
  ChannelType,
  MessageType,
} = require("discord.js");

const discoursePost = require("../functions/discourse.js").discoursePost;

// QUESTION unsure if passing client as prop is necessary

// Permissions check
// assuming role.id is an actual ID of a valid role:
// if (message.member.roles.cache.has(role.id)) {
//   console.log("Yay, the author of the message has the role!");
// }

// else {
//   console.log("Nope, noppers, nadda.");
// }

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Filter for bots, etc
    var excludedUsers = ["975038570546987018", "878399831238909952"];

    // *********************
    // Menu & Button Setters
    // *********************

    // Button Setup on Message Menu 'Discourse Submit' Selection

    if (interaction.commandName === "Discourse Submit") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("messageSubmit")
          .setLabel("Submit this Message")
          .setStyle("Primary"),

        new ButtonBuilder()
          .setCustomId("channelSubmit")
          .setLabel("Submit this Thread/Channel")
          .setStyle("Primary"),

        new ButtonBuilder()
          .setCustomId("selectMessages")
          .setLabel("Select Messages")
          .setStyle("Primary")
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

      const embed = new EmbedBuilder()
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
      await interaction.reply({
        content: "Message submitted to discourse by " + interaction.user,
      });
    }

    // Submit all messages if 'Submit All' button is clicked

    if (interaction.customId == "channelSubmit") {
      let result = await fetchAllMessages(interaction.channelId);

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

        await interaction.reply({
          content: "Message submitted to discourse by " + interaction.user,
        });
      }
    }

    // Build message selectors if 'Select Messages' button is clicked
    if (interaction.customId == "selectMessages") {
      let result = await fetchRecentMessages(interaction.channelId);

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

        const row = new ActionRowBuilder().addComponents(
          new SelectMenuBuilder()
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abortSubmission")
          .setLabel("Abort Submission")
          .setStyle("Danger"),

        new ButtonBuilder()
          .setCustomId("submitSelected")
          .setLabel("Submit")
          .setStyle("Danger")
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
      discoursePost(client.selectMessages.first());
      await interaction.reply({
        content: "Message submitted to discourse by " + interaction.user,
      });
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
      // check https://discordjs.guide/additional-info/changes-in-v14.html#messagecomponent
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

    async function fetchAllMessages(channelId) {
      const channel = client.channels.cache.get(channelId);

      if (channel.type === ChannelType.GuildPublicThread) {
        threadName = channel.name;
      }

      // Create message pointer
      // Fetches first message
      // Then fetches messages before that message
      // In a channel with > 100 messages, this can be an issue...
      // For the select menu, we want it to fetch the most recent
      // and then move up from there
      // but in the post, we want it to post from top down...

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
          .then((messagePage) =>
            messagePage.filter((m) => !excludedUsers.includes(m.author.id))
          )
          .then((messagePage) => {
            messagePage.forEach((msg) => {
              // this has issues (i believe) with starter messages that have been edited
              if (msg.type === MessageType.ThreadStarterMessage) {
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

      // Below should be something like excludedUsers.includes(user.id)
      client.messages.sweep((user) => user.id === 975038570546987018);
      client.messages.sort();
      return true;
    }

    // Limit to fetch most recent 25 messages (for Select Menu)
    // Update to fetch more to allow for multiple select menus (25+ messages)

    async function fetchRecentMessages(channelId) {
      const channel = client.channels.cache.get(channelId);

      if (channel.type === ChannelType.GuildPublicThread) {
        threadName = channel.name;
      }

      const messages = await channel.messages.fetch({ limit: 25 });

      const filteredMessages = messages.filter(
        (m) => !excludedUsers.includes(m.author.id)
      );
      
     for (const msg of filteredMessages.values()) {
        let mDetail;
        console.log(msg)

        if (msg.type === MessageType.ThreadStarterMessage) {
          const starter = await getThreadStarter(msg);

          mDetail = formatMessage(starter);
          client.messages.set(mDetail.id, mDetail);
          client.messages;
        } else {
          mDetail = formatMessage(msg);
        }
        if (mDetail.id) {
          client.messages.set(mDetail.id, mDetail);
        }
      }

      client.messages.sort();
      return true;
    }
  },
};
