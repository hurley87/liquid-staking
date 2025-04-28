'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatEther } from 'viem';

type WithdrawalRequest = {
  amount: string;
  unlockTime: string;
  isClaimable: boolean;
};

type UserWithdrawals = {
  address: string;
  requests: WithdrawalRequest[];
  error?: string;
};

type DailySummary = {
  date: string;
  totalAmount: bigint;
  requestCount: number;
};

export default function WithdrawalsPage() {
  const { ready } = usePrivy();
  const [withdrawals, setWithdrawals] = useState<UserWithdrawals[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    const fetchWithdrawals = async () => {
      try {
        const response = await fetch('/api/withdrawals');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch withdrawals');
        }

        setWithdrawals(data.data);

        // Calculate daily summaries
        const summaries = new Map<
          string,
          { totalAmount: bigint; count: number }
        >();

        data.data.forEach((userWithdrawals: UserWithdrawals) => {
          userWithdrawals.requests.forEach((request) => {
            if (!request.isClaimable) {
              const date = new Date(request.unlockTime)
                .toISOString()
                .split('T')[0];
              const amount = BigInt(request.amount);

              const existing = summaries.get(date) || {
                totalAmount: BigInt(0),
                count: 0,
              };
              summaries.set(date, {
                totalAmount: existing.totalAmount + amount,
                count: existing.count + 1,
              });
            }
          });
        });

        // Convert to array and sort by date
        const sortedSummaries = Array.from(summaries.entries())
          .map(([date, { totalAmount, count }]) => ({
            date,
            totalAmount,
            requestCount: count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setDailySummaries(sortedSummaries);
      } catch (err) {
        console.error('Error fetching withdrawals:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch withdrawals'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawals();
  }, [ready]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-20 max-w-3xl space-y-6">
      {/* Future Claims Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Future Claims Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading summary...</div>
          ) : dailySummaries.length === 0 ? (
            <div className="text-center py-8">No future claims scheduled</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount (PEAQ)</TableHead>
                    <TableHead>Number of Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySummaries.map((summary) => (
                    <TableRow key={summary.date}>
                      <TableCell>{summary.date}</TableCell>
                      <TableCell>{formatEther(summary.totalAmount)}</TableCell>
                      <TableCell>{summary.requestCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Withdrawal Requests */}
      <Card>
        <CardHeader>
          <CardTitle>All Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              Loading withdrawal requests...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">No withdrawal requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Amount (PEAQ)</TableHead>
                    <TableHead>Unlock Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((userWithdrawals) =>
                    userWithdrawals.requests.map((request, index) => (
                      <TableRow key={`${userWithdrawals.address}-${index}`}>
                        <TableCell className="font-mono text-sm">
                          {userWithdrawals.address.slice(0, 6)}...
                          {userWithdrawals.address.slice(-4)}
                        </TableCell>
                        <TableCell>
                          {formatEther(BigInt(request.amount))}
                        </TableCell>
                        <TableCell>
                          {new Date(request.unlockTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              request.isClaimable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {request.isClaimable ? 'Claimable' : 'Pending'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
