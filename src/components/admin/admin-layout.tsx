import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { type ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  defaultTab: 'withdraw' | 'distribute' | 'whitelist';
}

export function AdminLayout({ children, defaultTab }: AdminLayoutProps) {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen text-center">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-lg text-gray-500">
          Manage withdrawals, rewards, and collators
        </p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full max-w-md">
          <Link href="/admin/whitelist" className="w-full">
            <TabsTrigger value="whitelist" className="w-full">
              Whitelist
            </TabsTrigger>
          </Link>
          <Link href="/admin/withdraw" className="w-full">
            <TabsTrigger value="withdraw" className="w-full">
              Withdraw
            </TabsTrigger>
          </Link>
          <Link href="/admin/distribute" className="w-full">
            <TabsTrigger value="distribute" className="w-full">
              Distribute
            </TabsTrigger>
          </Link>
        </TabsList>
        <div className="w-full p-4">{children}</div>
      </Tabs>
    </div>
  );
}
