'use client';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { peaqChain, VALID_CHAIN_ID } from '@/lib/chain';
import { z } from 'zod';

const stakingLimitSchema = z.object({
  limit: z
    .string()
    .min(1, { message: 'Staking limit is required' })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Staking limit must be a valid number',
    })
    .refine((val) => Number(val) > 0, {
      message: 'Staking limit must be greater than 0',
    }),
});

export function SetStakingLimit() {
  const { user, login, ready } = usePrivy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [stakingLimit, setStakingLimit] = useState('');
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
      stakingLimitSchema.parse({ limit: stakingLimit });
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

  const handleSetStakingLimit = async () => {
    try {
      if (!validateInput()) {
        return;
      }

      if (chainId !== VALID_CHAIN_ID) {
        await switchNetwork();
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading('Setting staking limit...');

      const response = await fetch('/api/set-staking-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: stakingLimit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set staking limit');
      }

      const data = await response.json();

      toast.success('Staking limit set successfully', {
        id: toastId,
        description: `Transaction hash: ${data.hash}`,
      });

      // Clear the input after successful submission
      setStakingLimit('');
    } catch (error) {
      console.error('Error setting staking limit:', error);
      toast.error('Failed to set staking limit', {
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
    <div className="gap-6 p-6 border rounded-lg shadow-sm max-w-md mx-auto justify-center mt-80">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Set Staking Limit</h2>
        <p className="text-sm text-gray-500">
          This will set the maximum amount of PEAQ that can be staked in the
          contract.
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="staking-limit">Staking Limit (PEAQ)</Label>
          <Input
            id="staking-limit"
            type="text"
            placeholder="Enter staking limit"
            value={stakingLimit}
            onChange={(e) => setStakingLimit(e.target.value)}
            disabled={isSubmitting || isSwitchingNetwork}
          />
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
        </div>

        <Button
          onClick={handleSetStakingLimit}
          disabled={isSubmitting || isSwitchingNetwork || !stakingLimit}
          className="w-full"
        >
          {isSubmitting
            ? 'Setting Staking Limit...'
            : isSwitchingNetwork
            ? 'Switching Network...'
            : 'Set Staking Limit'}
        </Button>
      </div>
    </div>
  );
}
