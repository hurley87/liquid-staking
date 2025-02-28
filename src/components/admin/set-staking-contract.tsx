'use client';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VALID_CHAIN_ID } from '@/lib/chain';

export function SetStakingContract() {
  const { user, login, ready } = usePrivy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];

  if (!ready) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg">Please sign in to access admin functions</p>
        <Button onClick={() => login()}>Sign In</Button>
      </div>
    );
  }

  const handleSetStakingContract = async () => {
    try {
      if (chainId !== VALID_CHAIN_ID) {
        await switchNetwork();
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading('Setting staking contract...');

      const response = await fetch('/api/set-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set staking contract');
      }

      const data = await response.json();

      toast.success('Staking contract set successfully', {
        id: toastId,
        description: `Transaction hash: ${data.hash}`,
      });
    } catch (error) {
      console.error('Error setting staking contract:', error);
      toast.error('Failed to set staking contract', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchNetwork = async () => {
    try {
      setIsSwitchingNetwork(true);
      const toastId = toast.loading('Switching network...');

      if (!wallet) {
        throw new Error('No wallet connected');
      }

      // Using the wallet's ethereum provider to switch networks
      // @ts-ignore - The Privy wallet interface might not match the expected type
      await wallet.switchChain(Number(VALID_CHAIN_ID));

      toast.success('Network switched successfully', {
        id: toastId,
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 border rounded-lg shadow-sm">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Set Staking Contract</h2>
        <p className="text-sm text-gray-500">
          This will set the staking contract address in the stPEAQ token
          contract.
        </p>
      </div>

      <Button
        onClick={handleSetStakingContract}
        disabled={isSubmitting || isSwitchingNetwork}
        className="w-full"
      >
        {isSubmitting
          ? 'Setting Staking Contract...'
          : isSwitchingNetwork
          ? 'Switching Network...'
          : 'Set Staking Contract'}
      </Button>
    </div>
  );
}
