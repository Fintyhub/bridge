"use client";

import { Poppins } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { http, WagmiProvider } from "wagmi";
import { bsc } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import {
  walletConnectWallet,
  metaMaskWallet,
  rabbyWallet,
} from "@rainbow-me/rainbowkit/wallets";

const poppins = Poppins({ subsets: ["latin"], weight: "400" });

// const config = getDefaultConfig({
//   appName: "FTC (Fintyh COIN)",
//   projectId: "YOUR_PROJECT_ID",
//   chains: [bscTestnet],
//   transports: {
//     [bscTestnet.id]: http("https://bsc-testnet-rpc.publicnode.com"),
//   },
//   ssr: true,
//   wallets: [
//     {
//       groupName: "Recommended",
//       wallets: [walletConnectWallet, metaMaskWallet, rabbyWallet],
//     },
//   ],
// });

const config = getDefaultConfig({
  appName: "FTC (Fintyh COIN)",
  projectId: "YOUR_PROJECT_ID",
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
  ssr: true,
  wallets: [
    {
      groupName: "Recommended",
      wallets: [walletConnectWallet, metaMaskWallet, rabbyWallet],
    },
  ],
});

interface Props {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export default function template({ children }: Props) {
  return (
    <main className={poppins.className}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            locale="pt"
            theme={darkTheme({
              borderRadius: "small",
              fontStack: "system",
            })}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </main>
  );
}
