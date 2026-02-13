import { ActionProvider, ViemWalletProvider } from "@coinbase/agentkit";
import { z } from "zod";
import { formatUnits, parseUnits } from "viem";
import type { Network } from "@coinbase/agentkit";

const GetWalletDetailsSchema = z.object({});

const NativeTransferSchema = z
  .object({
    to: z.string().describe("The destination address to receive the funds"),
    value: z.string().describe("The amount to transfer in whole units e.g. 1 MNT or 0.00001 MNT"),
  })
  .strip()
  .describe("Instructions for transferring MNT (native token on Mantle)");

/**
 * Custom wallet action provider for Mantle network.
 * Replaces the default walletActionProvider which hardcodes "ETH" for all EVM chains.
 * On Mantle, the native token is MNT, not ETH.
 */
class MantleWalletActionProvider extends ActionProvider<ViemWalletProvider> {
  constructor() {
    super("mantle_wallet", []);
  }

  supportsNetwork(_: Network): boolean {
    return true;
  }

  /**
   * Override getActions to provide Mantle-specific wallet actions with MNT terminology.
   */
  getActions(walletProvider: ViemWalletProvider) {
    return [
      {
        name: "get_wallet_details",
        description: `This tool returns the details of the connected wallet on Mantle Sepolia including:
    - Wallet address
    - Network information (protocol family, network ID, chain ID)
    - Native token balance in MNT (the native token on Mantle)
    - Wallet provider name`,
        schema: GetWalletDetailsSchema,
        invoke: async (_args: z.infer<typeof GetWalletDetailsSchema>) => {
          try {
            const address = walletProvider.getAddress();
            const network = walletProvider.getNetwork();
            const balance = await walletProvider.getBalance();

            return [
              "Wallet Details:",
              `- Provider: ${walletProvider.getName()}`,
              `- Address: ${address}`,
              "- Network:",
              `  * Protocol Family: ${network.protocolFamily}`,
              `  * Network ID: ${network.networkId || "N/A"}`,
              `  * Chain ID: ${network.chainId || "N/A"}`,
              `- Native Balance: ${balance.toString()} WEI`,
              `- Native Balance: ${formatUnits(balance, 18)} MNT`,
            ].join("\n");
          } catch (error) {
            return `Error getting wallet details: ${error}`;
          }
        },
      },
      {
        name: "native_transfer",
        description: `This tool will transfer (send) MNT (the native token on Mantle network) from the wallet to another onchain address.

It takes the following inputs:
- amount: The amount of MNT to transfer in whole units (e.g. 4.2 MNT, 0.1 MNT)
- destination: The address to receive the MNT`,
        schema: NativeTransferSchema,
        invoke: async (args: z.infer<typeof NativeTransferSchema>) => {
          try {
            let to = args.to;
            if (!to.startsWith("0x")) {
              to = `0x${to}`;
            }
            const amountInWei = parseUnits(args.value, 18);
            const txHash = await walletProvider.nativeTransfer(to, amountInWei.toString());
            return `Transferred ${args.value} MNT to ${to}\nTransaction hash: ${txHash}`;
          } catch (error) {
            return `Error during MNT transfer: ${error}`;
          }
        },
      },
    ];
  }
}

/**
 * Factory function to create a MantleWalletActionProvider instance.
 */
export const mantleWalletActionProvider = () => new MantleWalletActionProvider();
