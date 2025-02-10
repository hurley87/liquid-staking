import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi, liquidStakingAddress } from '@/lib/LiquidStaking';

export function useGetAvailablePEAQ() {
  const [availablePEAQ, setAvailablePEAQ] = useState<string>('0');

  const fetchAvailablePEAQ = async () => {
    try {
      const available = await publicClient.readContract({
        address: liquidStakingAddress,
        abi: liquidStakingAbi,
        functionName: 'getAvailablePEAQForDelegation',
      });

      if (available) {
        setAvailablePEAQ(available?.toString());
      }
    } catch (error) {
      console.error('Error fetching available PEAQ:', error);
    }
  };

  useEffect(() => {
    fetchAvailablePEAQ();
  }, []);

  return { availablePEAQ, setAvailablePEAQ, refetch: fetchAvailablePEAQ };
}
