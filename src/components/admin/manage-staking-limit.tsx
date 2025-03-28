'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi } from '@/lib/LiquidStaking';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { toast } from 'sonner';
import { peaqChain, VALID_CHAIN_ID } from '@/lib/chain';

const stakingLimitFormSchema = z.object({
  limit: z.string().min(1, {
    message: 'Limit must be at least 1 character.',
  }),
});

type StakingLimitFormValues = z.infer<typeof stakingLimitFormSchema>;

const defaultValues: Partial<StakingLimitFormValues> = {
  limit: '',
};

export const ManageStakingLimit = () => {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isSetting, setIsSetting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [currentLimit, setCurrentLimit] = useState<string>('0');
  const form = useForm<StakingLimitFormValues>({
    resolver: zodResolver(stakingLimitFormSchema),
    defaultValues,
  });
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        const limit = await publicClient.readContract({
          address: liquidStakingAddress,
          abi: liquidStakingAbi,
          functionName: 'stakingLimit',
        });

        setCurrentLimit((Number(limit) / 1e18).toFixed(3));
      } catch (e) {
        console.error('Error fetching staking data:', e);
        toast.error('Error fetching staking data');
      }
    };

    fetchData();
  }, [address]);

  if (!ready) return null;

  const onSubmit = async (values: StakingLimitFormValues) => {
    setIsSetting(true);

    try {
      const ethereumProvider = await wallet?.getEthereumProvider();

      const walletClient = await createWalletClient({
        account: address,
        chain: peaqChain,
        transport: custom(ethereumProvider),
      });

      const { request } = await publicClient.simulateContract({
        address: liquidStakingAddress,
        abi: liquidStakingAbi,
        functionName: 'setStakingLimit',
        args: [BigInt(Math.floor(parseFloat(values.limit) * 1e18))],
        account: address,
      });

      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      toast.success(`Staking limit set to ${values.limit} PEAQ`);
      setCurrentLimit(values.limit);
      setIsSetting(false);
      form.reset();
    } catch (e) {
      console.error(e);
      toast.error('Error setting staking limit');
      setIsSetting(false);
    }
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl">
      <div className="flex p-8">
        <div className="w-full flex flex-col text-center">
          <div className="text-xs">Current Staking Limit</div>
          <div className="text-xl font-bold">{currentLimit} PEAQ</div>
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
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left flex justify-start">
                      New Staking Limit (PEAQ)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
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
                  disabled={isSetting}
                >
                  {isSetting ? 'Setting...' : 'Set Limit'}
                </Button>
              )}
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};
