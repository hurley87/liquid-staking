import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/publicClient';

/**
 * Hook to fetch the native token (PEAQ) balance of a wallet address
 * @param walletAddress The wallet address to fetch the balance for
 * @returns Object containing the balance and a function to set the balance
 */
export function useNativeBalance(walletAddress: string) {
  const [nativeBalance, setNativeBalance] = useState<string>('0');

  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (!walletAddress) return;

      try {
        const balance = await publicClient.getBalance({
          address: walletAddress as `0x${string}`,
        });

        if (balance) {
          setNativeBalance(balance.toString());
        }
      } catch (error) {
        console.error('Error fetching native balance:', error);
      }
    };

    fetchNativeBalance();
  }, [walletAddress]);

  return { nativeBalance, setNativeBalance };
}
