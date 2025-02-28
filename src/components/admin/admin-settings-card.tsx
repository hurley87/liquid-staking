'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AdminSettingsCard() {
  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm bg-white">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Contract Settings</h2>
        <p className="text-sm text-gray-500">
          Configure contract parameters and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button asChild className="w-full">
          <Link href="/admin/settings">Access Settings</Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href="/set-staking">Set Staking Contract</Link>
        </Button>
      </div>
    </div>
  );
}
