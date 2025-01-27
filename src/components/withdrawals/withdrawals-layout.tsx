import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { type ReactNode } from 'react';

interface WithdrawalsLayoutProps {
  children: ReactNode;
  defaultTab: 'request' | 'claim';
}

export function WithdrawalsLayout({
  children,
  defaultTab,
}: WithdrawalsLayoutProps) {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen text-center">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="text-lg text-gray-500">
          Request stPEAQ withdrawal and claim PEAQ
        </p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full max-w-sm">
          <Link href="/withdrawals/request" className="w-full">
            <TabsTrigger value="request" className="w-full">
              Request
            </TabsTrigger>
          </Link>
          <Link href="/withdrawals/claim" className="w-full">
            <TabsTrigger value="claim" className="w-full">
              Claim
            </TabsTrigger>
          </Link>
        </TabsList>
        <div className="w-full p-4">{children}</div>
      </Tabs>
    </div>
  );
}
