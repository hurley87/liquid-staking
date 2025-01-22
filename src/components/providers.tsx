'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';
// import { defineChain } from 'viem';

// const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;

// const peaqChain = defineChain({
//   id: 3338,
//   name: 'Peaq',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'PEAQ',
//     symbol: 'PEAQ',
//   },
//   rpcUrls: {
//     default: {
//       http: [RPC_URL],
//     },
//   },
// });

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'light',
        },
        defaultChain: baseSepolia,
        // supportedChains: [peaqChain],
        // defaultChain: peaqChain,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
