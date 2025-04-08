'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { VALID_CHAIN_ID } from '@/lib/chain';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createWalletClient, custom } from 'viem';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi } from '@/lib/LiquidStaking';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { peaqChain } from '@/lib/chain';

const withdrawalDelaySchema = z.object({
  delay: z
    .string()
    .min(1, { message: 'Withdrawal delay is required' })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Withdrawal delay must be a valid number',
    })
    .refine((val) => Number(val) > 0, {
      message: 'Withdrawal delay must be greater than 0',
    }),
});

type WithdrawalDelayFormValues = z.infer<typeof withdrawalDelaySchema>;

const defaultValues: Partial<WithdrawalDelayFormValues> = {
  delay: '',
};

export function ManageWithdrawalDelay() {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [currentDelay, setCurrentDelay] = useState<string>('0');
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];

  const form = useForm<WithdrawalDelayFormValues>({
    resolver: zodResolver(withdrawalDelaySchema),
    defaultValues,
  });

  if (!ready) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg">Please sign in to access admin functions</p>
        <Button onClick={() => login()}>Sign In</Button>
      </div>
    );
  }

  const switchNetwork = async () => {
    try {
      setIsSwitchingNetwork(true);
      await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const onSubmit = async (values: WithdrawalDelayFormValues) => {
    try {
      if (chainId !== VALID_CHAIN_ID) {
        await switchNetwork();
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading('Setting withdrawal delay...');

      const ethereumProvider = await wallet?.getEthereumProvider();
      const walletClient = await createWalletClient({
        account: address,
        chain: peaqChain,
        transport: custom(ethereumProvider),
      });

      const delayInSeconds = Number(values.delay) * 24 * 60 * 60; // Convert days to seconds

      const { request } = await publicClient.simulateContract({
        address: liquidStakingAddress,
        abi: liquidStakingAbi,
        functionName: 'setWithdrawalDelay',
        args: [delayInSeconds],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      setCurrentDelay(values.delay);
      toast.success('Withdrawal delay set successfully', {
        id: toastId,
        description: `Transaction hash: ${hash}`,
      });
    } catch (error) {
      console.error('Error setting withdrawal delay:', error);
      toast.error('Failed to set withdrawal delay', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl">
      <div className="flex p-8">
        <div className="w-full flex flex-col text-center">
          <div className="text-xs">Current Withdrawal Delay</div>
          <div className="text-xl font-bold">{currentDelay} days</div>
        </div>
      </div>
      {!user ? (
        <div className="w-full max-w-lg mx-auto border rounded-b-3xl p-8 flex flex-col gap-8">
          <Button onClick={login} className="w-full" size="lg">
            Connect Wallet
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-lg mx-auto border rounded-b-3xl p-8 flex flex-col gap-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="delay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left flex justify-start">
                      New Withdrawal Delay (days)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {chainId !== VALID_CHAIN_ID ? (
                <Button
                  onClick={switchNetwork}
                  className="w-full"
                  size="lg"
                  disabled={isSwitchingNetwork}
                >
                  {isSwitchingNetwork ? 'Switching...' : 'Switch to PEAQ'}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Setting...' : 'Set Withdrawal Delay'}
                </Button>
              )}
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
