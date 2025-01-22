'use client';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, login, ready, logout } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;

  return (
    <div className="absolute top-0 z-20 flex w-full flex-col">
      <nav className="flex h-24 w-full max-w-[1440px] flex-row items-center justify-between gap-4 md:gap-16 self-center bg-transparent px-4 md:px-8">
        <Link href="/">
          <Image src="/peaq.jpg" alt="Logo" width={44} height={44} />
        </Link>
        {!ready ? null : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost">
                {address.slice(0, 6)}...
                {address.slice(-4)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/">
                  Register Name
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href={`/profile/${address}`}>
                  Profile
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem className="cursor-pointer" onSelect={logout}>
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" onClick={login}>
            Connect
          </Button>
        )}
      </nav>
    </div>
  );
};
