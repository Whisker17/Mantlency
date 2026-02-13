import {
  ActionProvider,
  AgentKit,
  cdpApiActionProvider,
  erc20ActionProvider,
  ViemWalletProvider,
  WalletProvider,
} from "@coinbase/agentkit";
import { mantleWalletActionProvider } from "./mantle-wallet-action-provider";
import fs from "fs";
import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mantleSepoliaTestnet } from "viem/chains";

// Configure a file to persist a user's private key if none provided
const WALLET_DATA_FILE = process.env.WALLET_DATA_FILE || "wallet_data.txt";

/**
 * Prepares the AgentKit and WalletProvider.
 *
 * @returns The initialized AgentKit and WalletProvider.
 * @throws If the agent initialization fails.
 */
export async function prepareAgentkitAndWalletProvider(): Promise<{
  agentkit: AgentKit;
  walletProvider: WalletProvider;
}> {
  try {
    // Initialize WalletProvider
    let privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (privateKey && !privateKey.startsWith("0x")) {
      privateKey = `0x${privateKey}` as `0x${string}`;
    }
    if (!privateKey) {
      if (fs.existsSync(WALLET_DATA_FILE)) {
        privateKey = JSON.parse(fs.readFileSync(WALLET_DATA_FILE, "utf8")).privateKey;
        console.info("Found private key in wallet_data.txt");
      } else {
        privateKey = generatePrivateKey();
        fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify({ privateKey }));
        console.log("Created new private key and saved to wallet_data.txt");
        console.log(
          "We recommend you save this private key to your .env file and delete wallet_data.txt afterwards.",
        );
      }
    }
    const account = privateKeyToAccount(privateKey);

    // Use custom RPC URL if provided, otherwise use the chain's default
    const rpcUrl = process.env.RPC_URL || mantleSepoliaTestnet.rpcUrls.default.http[0];
    const transport = http(rpcUrl);

    const client = createWalletClient({
      account,
      chain: mantleSepoliaTestnet,
      transport,
    });
    const walletProvider = new ViemWalletProvider(client);

    console.log(`Wallet initialized: ${account.address} on Mantle Sepolia (chainId: ${mantleSepoliaTestnet.id})`);

    // Initialize AgentKit
    // - mantleWalletActionProvider: get_wallet_details, native_transfer (MNT)
    // - erc20ActionProvider: get_balance, transfer, approve, get_allowance, get_erc20_token_address
    const actionProviders: ActionProvider[] = [
      mantleWalletActionProvider(),
      erc20ActionProvider(),
    ];
    const canUseCdpApi = process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET;
    if (canUseCdpApi) {
      actionProviders.push(
        cdpApiActionProvider({
          apiKeyId: process.env.CDP_API_KEY_ID,
          apiKeySecret: process.env.CDP_API_KEY_SECRET,
        }),
      );
    }
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders,
    });

    return { agentkit, walletProvider };
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}
