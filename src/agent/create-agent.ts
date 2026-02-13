import { createOpenAI } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";
import { generateId, generateText, Message } from "ai";

// The agent configuration type
type Agent = {
  tools: ReturnType<typeof getVercelAITools>;
  system: string;
  model: ReturnType<typeof createOpenAI>;
  maxSteps?: number;
};

let agent: Agent;

// Per-channel conversation history
const conversationHistory = new Map<string, Message[]>();

/**
 * Initializes and returns the singleton AI agent instance.
 */
export async function createAgent(): Promise<Agent> {
  if (agent) {
    return agent;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required in .env");
  }

  const { agentkit } = await prepareAgentkitAndWalletProvider();

  try {
    // Initialize LLM via OpenRouter
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      compatibility: "compatible",
    });
    const model = openrouter("arcee-ai/trinity-large-preview:free");

    const system = `
You are **Mantlency**, the Autonomous Architect on Mantle Network.
You interact onchain on Mantle Sepolia testnet using the Coinbase AgentKit.
The native token on Mantle is MNT (not ETH).

Your wallet capabilities:
- get_wallet_details: Check wallet address, network, and native MNT balance
- native_transfer: Send MNT to another address
- get_balance: Check ERC20 token balances
- transfer: Transfer ERC20 tokens
- approve: Approve ERC20 token spending
- get_allowance: Check ERC20 token allowance

Operational rules:
- Before executing your first action, get the wallet details to see your address and balance.
- For write operations (transfer, deploy, mint, burn), confirm parameters before executing.
- If you need funds, provide your wallet address and ask the user to send MNT.
- Be concise, technical, and efficient in your responses.
- You are on Discord. Keep responses under 1800 characters when possible.
`.trim();

    const tools = getVercelAITools(agentkit);

    agent = { tools, system, model, maxSteps: 10 };

    return agent;
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}

/**
 * Sends a message to the agent and returns its response.
 * Maintains per-channel conversation history.
 *
 * @param channelId - The Discord channel ID (used as conversation key)
 * @param userMessage - The user's message content
 * @returns The agent's text response
 */
export async function chat(channelId: string, userMessage: string): Promise<string> {
  const agentConfig = await createAgent();

  // Get or create conversation history for this channel
  if (!conversationHistory.has(channelId)) {
    conversationHistory.set(channelId, []);
  }
  const messages = conversationHistory.get(channelId)!;

  // Add user message
  messages.push({ id: generateId(), role: "user", content: userMessage });

  // Keep conversation history manageable (last 50 messages)
  if (messages.length > 50) {
    messages.splice(0, messages.length - 50);
  }

  try {
    const { text } = await generateText({
      ...agentConfig,
      messages,
    });

    // Add assistant response to history
    messages.push({ id: generateId(), role: "assistant", content: text });

    return text;
  } catch (error) {
    console.error("Error generating response:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
    return `Error: ${errorMsg}`;
  }
}
