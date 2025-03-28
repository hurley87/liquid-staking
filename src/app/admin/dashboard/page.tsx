import { SetStakingButton } from '@/components/admin/set-staking-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your liquid staking platform</p>
        </div>

        <div className="flex justify-center">
          {/* Quick Actions */}
          <div className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm bg-white w-full max-w-md">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
              <p className="text-sm text-gray-500">
                Frequently used administrative functions
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <SetStakingButton className="w-full" />
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/withdraw">Manage Withdrawals</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/distribute">Distribute Rewards</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
