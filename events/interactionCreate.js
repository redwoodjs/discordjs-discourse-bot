const {
  MessageButton,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
  ButtonInteraction,
  SelectMenuInteraction,
} = require("discord.js");

const discoursePost = require("../functions/discourse.js").discoursePost;

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    var excludedUsers = ["975038570546987018", "878399831238909952"];

    if (interaction.commandName === "Discourse Submit") {
      client.messages.clear();

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
      let messages = [];

      const channel = client.channels.cache.get(interaction.channelId);
      const fetchedMessage = await channel.messages.fetch(interaction.targetId);

      user = fetchedMessage.author.username;
      message = fetchedMessage.content;
      messages = { title: message, raw: `${user}\n${message}` };

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

    if (interaction.customId === "messageSubmit") {
      discoursePost(messages);
      await interaction.reply({
        content: `Message submitted to discourse by ${interaction.user.username}`,
        ephemeral: true,
      });
    }

    if (interaction.customId === "channelSubmit") {
      const messages = new Map();

      function buildMessage(m) {
        return `**${m.username}**\n${m.content}\n\n`;
      }

      const result = await fetchAllMessages(interaction.channelId);

      if (result) {
        messages.set("title", client.messages.first().content);

        client.messages.forEach((m) => {
          messages.set("raw", messages.get("raw") + buildMessage(m));
        });

        discoursePost(messages);
        await interaction.reply({
          content: `Message submitted to discourse by ${interaction.user.username}`,
          ephemeral: true,
        });
      }
    }

    if (interaction.customId === "selectMessages") {
      const recentMessages = await fetchRecentMessages(interaction.channelId);
    
      if (recentMessages) {
        const messageOptions = client.messages
          .map((message) => ({
            label: message.username,
            description: limit(message.content, 100),
            value: message.id,
          }))
          .slice(0, 25);
    
        const messageSelectMenu = new MessageSelectMenu()
          .setCustomId("select")
          .setPlaceholder("Nothing selected")
          .setMinValues(1)
          .setMaxValues(messageOptions.length)
          .addOptions(messageOptions);
    
        const messageActionRow = new MessageActionRow().addComponents(
          messageSelectMenu
        );
    
        interaction.reply({
          content: "Select messages",
          ephemeral: true,
          components: [messageActionRow],
        });
      }
    }
    

    if (interaction.isSelectMenu()) {
      const messageIds = interaction.values;
      const title = client.messages.get(messageIds[0]).content;
      const messagesRaw = messageIds
        .map((id) => {
          const message = client.messages.get(id);
          return `**${message.username}**\n${message.content}\n\n`;
        })
        .join("");
    
      const messages = { title, raw: messagesRaw };
    
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("abortSubmission")
          .setLabel("Abort Submission")
          .setStyle("DANGER"),
        new MessageButton()
          .setCustomId("submitSelected")
          .setLabel("Submit")
          .setStyle("DANGER")
      );
    
      client.selectMessages.set(1, messages);
    
      await interaction.reply({
        content: `Your Discourse topic will look like the following: \n \n${messagesRaw}`,
        ephemeral: true,
        components: [row],
      });
    }
    

    if (interaction.customId === "submitSelected") {
      const messages = client.selectMessages.first();
      await discoursePost(messages);
      await interaction.reply({
        content: `Message submitted to discourse by ${interaction.user.username}`,
        ephemeral: true,
      });
    }

    if (interaction.customId === "abortSubmission") {
      client.messages.clear();
      client.selectMessages.clear();

      await interaction.reply({
        content: "Message submission aborted and cleared.",
        ephemeral: true,
      });
    }

    function limit(string = "", limit = 0) {
      return string.substring(0, limit);
    }

    async function getThreadStarter(msg) {
      const chan = client.channels.cache.get(msg.reference.channelId);
      const mess = await chan.messages.fetch(msg.reference.messageId);
      return mess;
    }

    function formatMessage(msg) {
      let fMessage = {};
      if (msg.content === "") {
        if (msg.attachments.size > 0) {
          fMessage.content = "Attachment";
        }
      } else {
        fMessage.content = msg.content;
      }
      fMessage.username = msg.author.username;
      fMessage.createdTimestamp = msg.createdTimestamp;
      fMessage.id = msg.id;

      return fMessage;
    }

    async function fetchAllMessages(channelId) {
      const channel = client.channels.cache.get(channelId);
      let threadName = "";

      if (channel.type === "GUILD_PUBLIC_THREAD") {
        threadName = channel.name;
      }

      let message = await channel.messages
        .fetch({ limit: 1 })
        .then((messagePage) =>
          messagePage.size === 1 ? messagePage.at(0) : null
        );

      const messageDetails = formatMessage(message);
      client.messages.set(messageDetails.id, messageDetails);

      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then((messagePage) => {
            messagePage.forEach(async (msg) => {
              const messageDetails = await getMessageDetails(msg);
              if (messageDetails.id) {
                client.messages.set(messageDetails.id, messageDetails);
              }
            });
            message =
              messagePage.size > 0
                ? messagePage.at(messagePage.size - 1)
                : null;
          });
      }

      client.messages.sweep((user) => excludedUsers.includes(user.id));
      client.messages.sort();
      return true;
    }

    async function getMessageDetails(msg) {
      let messageDetails = {};
      if (msg.type === "THREAD_STARTER_MESSAGE") {
        messageDetails = await getThreadStarter(msg);
      } else {
        messageDetails = formatMessage(msg);
      }
      return messageDetails;
    }

    async function fetchRecentMessages(channelId) {
      const channel = client.channels.cache.get(channelId);

      let threadName = "";
      if (channel.type === "GUILD_PUBLIC_THREAD") {
        threadName = channel.name;
      }

      const messages = await channel.messages.fetch({ limit: 25 });

      for (const message of messages.values()) {
        let messageDetails;

        if (message.type === "THREAD_STARTER_MESSAGE") {
          const threadStarter = await getThreadStarter(message);
          messageDetails = formatMessage(threadStarter);
          client.messages.set(messageDetails.id, messageDetails);
        } else {
          messageDetails = formatMessage(message);
        }

        if (messageDetails.id) {
          client.messages.set(messageDetails.id, messageDetails);
        }
      }

      client.messages.sweep((user) => excludedUsers.includes(user.id));
      client.messages.sort();

      return true;
    }
  },
};
