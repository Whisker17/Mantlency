# Mantlency — Onchain Agent Powered by AgentKit

A Discord bot that integrates [AgentKit](https://github.com/coinbase/agentkit) to provide AI-driven interactions with on-chain capabilities on the Mantle Sepolia testnet.

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### 1. Configure Environment Variables

Copy the example environment file and fill in your values:

```sh
cp .env.example .env
```

Edit `.env` with your actual keys:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for LLM |
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token |
| `PRIVATE_KEY` | No | Ethereum private key (0x-prefixed). Auto-generated if not set |
| `RPC_URL` | No | Mantle Sepolia RPC URL (has default) |
| `CDP_API_KEY_ID` | No | Coinbase Developer Platform API key ID |
| `CDP_API_KEY_SECRET` | No | Coinbase Developer Platform API key secret |

### 2. Build & Run with Docker Compose

```sh
# Build and start in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Rebuilding after code changes

```sh
docker compose up -d --build
```

### Local Development (without Docker)

If you prefer running locally:

```sh
npm install
npm run dev
```

## Configuring Your Agent

You can [modify your configuration](https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#usage) of the agent. The agentkit configuration is in `src/agent/prepare-agentkit.ts`, and agent instantiation is in `src/agent/create-agent.ts`.

### 1. Select Your LLM
Modify the OpenAI model instantiation to use the model of your choice.

### 2. Select Your Wallet Provider
AgentKit requires a **Wallet Provider** to interact with blockchain networks.

### 3. Select Your Action Providers
Action Providers define what your agent can do. You can use built-in providers or create your own.

---

## Learn More

- [Learn more about CDP](https://docs.cdp.coinbase.com/)
- [Learn more about AgentKit](https://docs.cdp.coinbase.com/agentkit/docs/welcome)

## Contributing

Interested in contributing to AgentKit? Follow the contribution guide:

- [Contribution Guide](https://github.com/coinbase/agentkit/blob/main/CONTRIBUTING.md)
- Join the discussion on [Discord](https://discord.gg/CDP)
