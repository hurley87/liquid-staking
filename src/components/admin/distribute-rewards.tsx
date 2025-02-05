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
import { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi } from '@/lib/LiquidStaking';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { toast } from 'sonner';
import { useGetTotalStaked } from '@/hooks/useGetTotalStaked';

const VALID_CHAIN_ID = '84532';

const accountFormSchema = z.object({
  amount: z.string().min(1, {
    message: 'Amount must be at least 1 character.',
  }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const defaultValues: Partial<AccountFormValues> = {
  amount: '',
};

export const DistributeRewards = () => {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isStaking, setIsStaking] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];
  const [stakedAmount, setStakedAmount] = useState('0');
  const { totalStaked, setTotalStaked } = useGetTotalStaked();

  if (!ready) return null;

  const onSubmit = async (values: AccountFormValues) => {
    setIsStaking(true);

    try {
      const ethereumProvider = await wallet?.getEthereumProvider();

      const walletClient = await createWalletClient({
        account: address,
        chain: baseSepolia,
        transport: custom(ethereumProvider),
      });

      const { request } = await publicClient.simulateContract({
        address: liquidStakingAddress,
        abi: liquidStakingAbi,
        functionName: 'distributeRewards',
        args: [],
        account: address,
        value: BigInt(Math.floor(parseFloat(values.amount) * 1e18)),
      });

      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      toast.success(`Staked ${values.amount} PEAQ`);

      setIsStaking(false);
      setTotalStaked(
        (parseFloat(totalStaked) + parseFloat(values.amount) * 1e18).toFixed(3)
      );
    } catch (e) {
      console.log(e);
      toast.error('Error distributing rewards');
      setIsStaking(false);
    }
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  const handleAmountChange = (value: string) => {
    if (!value || isNaN(parseFloat(value))) {
      setStakedAmount('0');
      return;
    }
    setStakedAmount(parseFloat(value).toFixed(3));
  };

  return (
    <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl">
      <div className="flex p-8">
        <div className="w-full flex flex-col text-center">
          <div className="text-xs">Total staked PEAQ</div>
          <div className="text-xl font-bold">
            {(parseFloat(totalStaked) / 1e18).toFixed(3)} stPEAQ
          </div>
        </div>
        {/* <div className="w-full flex flex-col text-left">
          <div className="text-xs">APR</div>
          <div className="text-xl font-bold">3.1%</div>
        </div> */}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left flex justify-start">
                      Amount of PEAQ to distribute
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleAmountChange(e.target.value);
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
                  disabled={isStaking}
                >
                  {isStaking ? 'Distributing...' : 'Distribute'}
                </Button>
              )}
            </form>
          </Form>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <div>Distribution amount</div>
              <div>{stakedAmount} PEAQ</div>
            </div>
            <div className="flex justify-between">
              <div>Earned PEAQ</div>
              <div>{(parseFloat(stakedAmount) / 10).toFixed(3)} PEAQ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
