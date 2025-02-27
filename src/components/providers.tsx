'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { peaqChain } from '@/lib/chain';

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
        supportedChains: [peaqChain],
        defaultChain: peaqChain,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
