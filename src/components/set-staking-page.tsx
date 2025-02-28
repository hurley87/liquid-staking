'use client';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VALID_CHAIN_ID } from '@/lib/chain';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { stPEAQAddress } from '@/lib/stPEAQ';

export function SetStakingPageComponent() {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const { wallets } = useWallets();
  const wallet = wallets?.[0];
  const chainId = wallet?.chainId?.split(':')[1];
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-6 p-8 border rounded-lg shadow-md bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500 mb-4">
            Please sign in with your wallet to access this functionality
          </p>
        </div>
        <Button
          onClick={() => login()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Connect Wallet
        </Button>
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
      setTxHash(null);
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
      setTxHash(data.hash);

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
    <div className="flex flex-col gap-6 p-8 border rounded-lg shadow-md bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-1">stPEAQ Token</h3>
          <p className="text-xs text-gray-500 break-all">{stPEAQAddress}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-1">
            Liquid Staking Contract
          </h3>
          <p className="text-xs text-gray-500 break-all">
            {liquidStakingAddress}
          </p>
        </div>
      </div>

      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold mb-2">Set Staking Contract</h2>
        <p className="text-sm text-gray-500">
          This action will set the Liquid Staking contract address in the stPEAQ
          token contract. This operation can only be performed by the contract
          owner.
        </p>
      </div>

      {txHash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-green-700 mb-1">
            Transaction Successful
          </h3>
          <p className="text-xs text-green-600 break-all">
            Transaction Hash: {txHash}
          </p>
          <a
            href={`https://explorer.peaq.network/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-700 underline mt-2 inline-block"
          >
            View on Explorer
          </a>
        </div>
      )}

      <Button
        onClick={handleSetStakingContract}
        disabled={isSubmitting || isSwitchingNetwork}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isSubmitting
          ? 'Setting Staking Contract...'
          : isSwitchingNetwork
          ? 'Switching Network...'
          : 'Set Staking Contract'}
      </Button>

      <div className="text-xs text-gray-500 mt-2">
        <p>Connected as: {address}</p>
        <p>
          Current network:{' '}
          {chainId === VALID_CHAIN_ID ? 'PEAQ Network' : 'Wrong Network'}
        </p>
      </div>
    </div>
  );
}
