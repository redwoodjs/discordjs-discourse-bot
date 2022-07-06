const {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} = require("discord.js");

const discoursePost = require("../functions/discourse.js").discoursePost

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
        messages = { title: message, raw: user + "\n" + message};
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
      discoursePost(messages)
    }

    // Submit all messages if 'Submit All' button is clicked

    if (interaction.customId == "channelSubmit") {
      messages = { 
        title: '',
        raw: ''
      }

      fetchAllMessages(interaction.channelId).then((m) => {

        messages.title = m[m.length - 1].content

        m.slice(0).reverse().forEach((m) => {
          messages.raw += '**' + m.username + '**\n'
          messages.raw += m.content + '\n'
          messages.raw += '\n'
        });

//        interaction.reply({ content: m.length + " messages" });
        discoursePost(messages)
      });
      
    }

    // Build message selectors if 'Select Messages' button is clicked
    if (interaction.customId == "selectMessages") {
      itemsJson = "";
      
      fetchAllMessages(interaction.channelId).then((m) => {
        itemsJson = JSON.stringify(m.length);
        
        // May want to use a Collector() object for options instead of array
        options = [];
        m.forEach((m) => {
          let object = {};
          object.label = m.username;
          object.description = limit(m.content, 100);
          object.value = m.id;
          options.push(object);
        });

        // Truncate message to 25; 
        // Expand this to multiple select menus to allow for more message history selection
        options.length = 25;

        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("select")
            .setPlaceholder("Nothing selected")
            .setMinValues(1)
            .setMaxValues(25)
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

        interaction.reply({ content: "Select messages", components: [row] });
      });
    }

    // *********************
    // Select Menu Functions
    // *********************

    // Catch selected message Ids, compose messages, send to Discourse
    if (interaction.isSelectMenu()) {
      messages = [];

      interaction.values.forEach((m) => {
        message = client.messages.get(m);
        messages += '**' + message.username + '**\n'
        messages += message.content + '\n'
        messages += '\n'
      });

      await interaction.reply({
        content:
          "Your Discourse topic will look like the following: \n \n" +
          messages
      });
    }

    // *********************
    // Other Functions
    // *********************

    // String limiter (100 for Select Menu)
    function limit(string = "", limit = 0) {
      return string.substring(0, limit);
    }


    // TODO: Function: Format post data: { title: 'string', content: 'string' }
    // Single function to process all three message submittal options
    

    // Fetch all messages & return author, content, id and timestamp
    // Function skeleton taken from stack overflow answer.

    async function fetchAllMessages(channelId) {
      const channel = client.channels.cache.get(channelId);

      // may be able to use the client.messages collection here instead of array
      // already pushing to it for storage
      let messages = [];

      if (channel.isThread()) {
        threadName = channel.name;
        console.log("Thread" + threadName);
      }

      // Create message pointer
      let message = await channel.messages
        .fetch({ limit: 1 })
        .then((messagePage) =>
          messagePage.size === 1 ? messagePage.at(0) : null
        );

      const mDetail = {};
      mDetail.content = message.content;
      mDetail.username = message.author.username;
      mDetail.createdTimestamp = message.createdTimestamp;
      mDetail.id = message.id;

      client.messages.set(mDetail.id, mDetail);
      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then((messagePage) => {
            messagePage.forEach((msg) => {
              const mDetails = {};
              mDetails.content = msg.content;
              mDetails.username = msg.author.username;
              mDetails.createdTimestamp = msg.createdTimestamp;
              mDetails.id = msg.id;
              client.messages.set(mDetails.id, mDetails);

              messages.push(mDetails);
            });
            // Update our message pointer to be last message in page of messages
            message =
              0 < messagePage.size
                ? messagePage.at(messagePage.size - 1)
                : null;
          });
      }

      return messages;
    }
  },
};
