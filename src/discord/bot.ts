import { Client, Events, GatewayIntentBits, Message, Partials } from "discord.js";
import { chat } from "../agent/create-agent";

const DISCORD_MESSAGE_LIMIT = 2000;

/**
 * Splits a long message into chunks that fit within Discord's character limit.
 */
function splitMessage(text: string, maxLength = DISCORD_MESSAGE_LIMIT): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline
    let splitIndex = remaining.lastIndexOf("\n", maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      // Fall back to splitting at a space
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      // Hard split
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trimStart();
  }

  return chunks;
}

/**
 * Creates and starts the Discord bot.
 */
export async function startDiscordBot(): Promise<Client> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is required in .env");
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel], // Required for DM support
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
    console.log(`Invite URL: https://discord.com/api/oauth2/authorize?client_id=${readyClient.user.id}&permissions=274877908992&scope=bot`);
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore messages from bots (including self)
    if (message.author.bot) return;

    // Check if the bot should respond:
    // 1. Direct messages (DMs)
    // 2. Messages that mention the bot
    const isDM = !message.guild;
    const isMentioned = message.mentions.has(client.user!);

    if (!isDM && !isMentioned) return;

    // Strip the bot mention from the message content
    let content = message.content;
    if (isMentioned && client.user) {
      content = content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
    }

    // Ignore empty messages after stripping mention
    if (!content) {
      await message.reply("How can I help you? Ask me about wallet operations, balances, or transfers on Mantle Sepolia.");
      return;
    }

    // Show typing indicator while processing
    try {
      await message.channel.sendTyping();
    } catch {
      // Ignore typing errors
    }

    // Set up a typing interval (Discord typing indicator lasts ~10s)
    const typingInterval = setInterval(async () => {
      try {
        await message.channel.sendTyping();
      } catch {
        clearInterval(typingInterval);
      }
    }, 8000);

    try {
      console.log(`[${message.guild?.name || "DM"}] ${message.author.tag}: ${content}`);

      const response = await chat(message.channelId, content);

      console.log(`[Response] ${response.slice(0, 100)}...`);

      // Split long responses into multiple messages
      const chunks = splitMessage(response);
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      await message.reply("Sorry, I encountered an error processing your request. Please try again.");
    } finally {
      clearInterval(typingInterval);
    }
  });

  await client.login(token);
  return client;
}
