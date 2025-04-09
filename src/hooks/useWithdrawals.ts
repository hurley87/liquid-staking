import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi, liquidStakingAddress } from '@/lib/LiquidStaking';

interface WithdrawalRequest {
  amount: bigint;
  unlockTime: bigint;
}

type WithdrawalStatus = 'pending' | 'completed';

interface Withdrawal {
  amount: number;
  unlockTime: number;
  status: WithdrawalStatus;
}

interface GroupedWithdrawals {
  [date: string]: {
    totalAmount: number;
    withdrawals: Withdrawal[];
  };
}

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<GroupedWithdrawals>({});

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const withdrawalRequests = (await publicClient.readContract({
          address: liquidStakingAddress,
          abi: liquidStakingAbi,
          functionName: 'getWithdrawalRequests',
          args: [liquidStakingAddress], // Get all withdrawal requests
        })) as WithdrawalRequest[];

        // Convert withdrawal requests to a more usable format
        const formattedWithdrawals = withdrawalRequests.map((request) => {
          const unlockTime = Number(request.unlockTime);
          const amount = Number(request.amount);
          const status: WithdrawalStatus =
            unlockTime > Date.now() / 1000 ? 'pending' : 'completed';

          return {
            amount,
            unlockTime,
            status,
          };
        });

        // Group withdrawals by date
        const groupedWithdrawals =
          formattedWithdrawals.reduce<GroupedWithdrawals>((acc, withdrawal) => {
            const date = new Date(withdrawal.unlockTime * 1000)
              .toISOString()
              .split('T')[0];
            if (!acc[date]) {
              acc[date] = {
                totalAmount: 0,
                withdrawals: [],
              };
            }
            acc[date].totalAmount += withdrawal.amount;
            acc[date].withdrawals.push(withdrawal);
            return acc;
          }, {});

        setWithdrawals(groupedWithdrawals);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      }
    };

    fetchWithdrawals();
  }, []);

  return { withdrawals };
}
