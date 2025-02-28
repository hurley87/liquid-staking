'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SetStakingButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SetStakingButton({
  variant = 'default',
  size = 'default',
  className = '',
}: SetStakingButtonProps) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href="/set-staking">Set Staking Contract</Link>
    </Button>
  );
}
