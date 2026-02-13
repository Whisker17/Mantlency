import "dotenv/config";
import { startDiscordBot } from "./discord/bot";
import { createAgent } from "./agent/create-agent";

async function main() {
  console.log("Starting Mantlency Agent...");

  // Pre-initialize the agent (warm up wallet + LLM connection)
  console.log("Initializing agent and wallet...");
  try {
    await createAgent();
    console.log("Agent initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    process.exit(1);
  }

  // Start Discord bot
  console.log("Connecting to Discord...");
  try {
    await startDiscordBot();
    console.log("Mantlency is online and ready!");
  } catch (error) {
    console.error("Failed to start Discord bot:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
