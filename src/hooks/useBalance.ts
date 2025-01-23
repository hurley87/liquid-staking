import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/publicClient';
import { stPEAQAbi, stPEAQAddress } from '@/lib/stPEAQ';

export function useBalance(walletAddress: string) {
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;
      try {
        const balance = await publicClient.readContract({
          address: stPEAQAddress,
          abi: stPEAQAbi,
          functionName: 'balanceOf',
          args: [walletAddress],
        });

        if (balance) {
          setBalance(balance?.toString());
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, [walletAddress]);

  return { balance, setBalance };
}
