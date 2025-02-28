'use client';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { VALID_CHAIN_ID } from '@/lib/chain';
import { z } from 'zod';
import { isAddress } from 'viem';

const ownershipSchema = z.object({
  newOwner: z
    .string()
    .min(1, { message: 'New owner address is required' })
    .refine((val) => isAddress(val), {
      message: 'Invalid Ethereum address format',
    }),
});

export function TransferOwnership() {
  const { user, login, ready } = usePrivy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [validationError, setValidationError] = useState('');
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

  const validateInput = () => {
    try {
      ownershipSchema.parse({ newOwner });
      setValidationError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      } else {
        setValidationError('Invalid input');
      }
      return false;
    }
  };

  const handleTransferOwnership = async () => {
    try {
      if (!validateInput()) {
        return;
      }

      if (chainId !== VALID_CHAIN_ID) {
        await switchNetwork();
        return;
      }

      // Show a confirmation dialog before proceeding
      const confirmed = window.confirm(
        `Are you sure you want to transfer ownership to ${newOwner}? This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading('Transferring ownership...');

      const response = await fetch('/api/transfer-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwner }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer ownership');
      }

      const data = await response.json();

      toast.success('Ownership transferred successfully', {
        id: toastId,
        description: `Transaction hash: ${data.hash}`,
      });

      // Clear the input after successful submission
      setNewOwner('');
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast.error('Failed to transfer ownership', {
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
    <div className="flex flex-col items-center gap-6 p-6 border rounded-lg shadow-sm max-w-md mx-auto justify-center mt-60">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          Transfer Contract Ownership
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          This will transfer ownership of the staking contract to a new address.
          <span className="block mt-2 font-semibold text-amber-600">
            Warning: This action cannot be undone. Make sure you enter the
            correct address.
          </span>
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-owner">New Owner Address</Label>
          <Input
            id="new-owner"
            type="text"
            placeholder="0x..."
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            disabled={isSubmitting || isSwitchingNetwork}
          />
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
        </div>

        <Button
          onClick={handleTransferOwnership}
          disabled={isSubmitting || isSwitchingNetwork || !newOwner}
          variant="destructive"
          className="w-full"
        >
          {isSubmitting
            ? 'Transferring Ownership...'
            : isSwitchingNetwork
            ? 'Switching Network...'
            : 'Transfer Ownership'}
        </Button>
      </div>
    </div>
  );
}
