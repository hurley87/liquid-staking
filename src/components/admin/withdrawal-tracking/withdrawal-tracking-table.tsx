'use client';

import { useWithdrawals } from '@/hooks/useWithdrawals';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';

export function WithdrawalTrackingTable() {
  const { allWithdrawals } = useWithdrawals();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Unlock Time</TableHead>
            <TableHead>Time Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allWithdrawals.map((withdrawal, index) => (
            <TableRow key={index}>
              <TableCell>
                {formatEther(BigInt(withdrawal.amount))} PEAQ
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    withdrawal.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {withdrawal.status}
                </span>
              </TableCell>
              <TableCell>
                {new Date(withdrawal.unlockTime * 1000).toLocaleString()}
              </TableCell>
              <TableCell>
                {withdrawal.status === 'pending'
                  ? formatDistanceToNow(withdrawal.unlockTime * 1000, {
                      addSuffix: true,
                    })
                  : 'Completed'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
