'use client';

import { useWithdrawals } from '@/hooks/useWithdrawals';

export function WithdrawalTrackingTable() {
  const { withdrawals } = useWithdrawals();

  if (Object.keys(withdrawals).length === 0) {
    return <div>No withdrawals found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Total Amount to Unstake</th>
            <th className="px-4 py-2 text-left">Number of Withdrawals</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(withdrawals).map(([date, data]) => (
            <tr key={date} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{date}</td>
              <td className="px-4 py-2">{data.totalAmount} PEAQ</td>
              <td className="px-4 py-2">{data.withdrawals.length}</td>
              <td className="px-4 py-2">
                {data.withdrawals.some((w) => w.status === 'pending')
                  ? 'Pending'
                  : 'Completed'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
