import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi, liquidStakingAddress } from '@/lib/LiquidStaking';

export function useGetTotalStaked() {
  const [totalStaked, setTotalStaked] = useState<string>('0');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const totalStaked = await publicClient.readContract({
          address: liquidStakingAddress,
          abi: liquidStakingAbi,
          functionName: 'getTotalStaked',
        });

        if (totalStaked) {
          setTotalStaked(totalStaked?.toString());
        }
      } catch (error) {
        console.error('Error fetching total staked:', error);
      }
    };

    fetchBalance();
  }, []);

  return { totalStaked, setTotalStaked };
}
