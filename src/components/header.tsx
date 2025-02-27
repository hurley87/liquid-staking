'use client';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const Header = () => {
  const { user, login, ready, logout } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const pathname = usePathname();

  // Function to check if a link is active
  const isActive = (path: string) => {
    // For home/stake page, only match exact path
    if (path === '/') {
      return pathname === '/';
    }
    // For other pages, check if pathname starts with the path
    return pathname.startsWith(path);
  };

  return (
    <div className="absolute top-0 z-20 flex w-full flex-col">
      <nav className="flex h-24 w-full max-w-[1440px] flex-row items-center justify-between gap-4 md:gap-16 self-center bg-transparent px-4 md:px-8">
        <Link href="/">
          <Image src="/peaq.jpg" alt="Logo" width={44} height={44} />
        </Link>

        {!ready ? null : user ? (
          <div className="flex items-center gap-6">
            {/* Main navigation links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                className={cn(
                  'text-sm font-medium hover:text-primary transition-colors relative py-1',
                  isActive('/') &&
                    'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary'
                )}
                href="/"
              >
                Stake
              </Link>
              <Link
                className={cn(
                  'text-sm font-medium hover:text-primary transition-colors relative py-1',
                  isActive('/withdrawals') &&
                    'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary'
                )}
                href="/withdrawals/request"
              >
                Withdrawals
              </Link>
            </div>

            {/* User account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <span className="text-sm">
                    {address.slice(0, 6)}...
                    {address.slice(-4)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Mobile-only navigation links */}
                <div className="md:hidden">
                  <DropdownMenuItem asChild>
                    <Link
                      className={cn(
                        'cursor-pointer w-full',
                        isActive('/') && 'font-medium text-primary'
                      )}
                      href="/"
                    >
                      Stake {isActive('/') && '•'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      className={cn(
                        'cursor-pointer w-full',
                        isActive('/withdrawals') && 'font-medium text-primary'
                      )}
                      href="/withdrawals/request"
                    >
                      Withdrawals {isActive('/withdrawals') && '•'}
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuItem className="cursor-pointer" onSelect={logout}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="ghost" onClick={login}>
            Connect
          </Button>
        )}
      </nav>
    </div>
  );
};
