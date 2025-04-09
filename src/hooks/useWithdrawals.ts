import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi, liquidStakingAddress } from '@/lib/LiquidStaking';
import { stPEAQAbi, stPEAQAddress } from '@/lib/stPEAQ';

interface WithdrawalRequest {
  amount: bigint;
  unlockTime: bigint;
}

type WithdrawalStatus = 'pending' | 'completed';

interface Withdrawal {
  amount: number;
  unlockTime: number;
  status: WithdrawalStatus;
  holder: string;
}

interface GroupedWithdrawals {
  [date: string]: {
    totalAmount: number;
    withdrawals: Withdrawal[];
  };
}

interface TransferEvent {
  eventName: 'Transfer';
  args: {
    from: string;
    to: string;
    value: bigint;
  };
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: bigint;
  address: string;
  topics: string[];
  data: string;
}

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<GroupedWithdrawals>({});
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setIsLoading(true);
        // Get all Transfer events to find stPEAQ holders
        const transferEvents = (await publicClient.getContractEvents({
          address: stPEAQAddress,
          abi: stPEAQAbi,
          eventName: 'Transfer',
          fromBlock: BigInt(0),
          toBlock: 'latest',
        })) as TransferEvent[];

        // Extract unique addresses from Transfer events
        const uniqueAddresses = new Set<string>();
        transferEvents.forEach((event: TransferEvent) => {
          if (event.args.to) uniqueAddresses.add(event.args.to);
          if (event.args.from) uniqueAddresses.add(event.args.from);
        });

        // Get withdrawal requests for each holder
        const allWithdrawalRequests: Withdrawal[] = [];

        for (const holder of uniqueAddresses) {
          try {
            const holderRequests = (await publicClient.readContract({
              address: liquidStakingAddress,
              abi: liquidStakingAbi,
              functionName: 'getWithdrawalRequests',
              args: [holder],
            })) as WithdrawalRequest[];

            const formattedRequests = holderRequests.map((request) => {
              const unlockTime = Number(request.unlockTime);
              const amount = Number(request.amount);
              const status: WithdrawalStatus =
                unlockTime > Date.now() / 1000 ? 'pending' : 'completed';

              return {
                amount,
                unlockTime,
                status,
                holder,
              };
            });

            allWithdrawalRequests.push(...formattedRequests);
          } catch (error) {
            console.error(
              `Error fetching withdrawals for holder ${holder}:`,
              error
            );
          }
        }

        setAllWithdrawals(allWithdrawalRequests);

        // Group withdrawals by date
        const groupedWithdrawals =
          allWithdrawalRequests.reduce<GroupedWithdrawals>(
            (acc, withdrawal) => {
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
            },
            {}
          );

        setWithdrawals(groupedWithdrawals);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

  return { withdrawals, allWithdrawals, isLoading };
}
