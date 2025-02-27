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
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi } from '@/lib/LiquidStaking';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { toast } from 'sonner';
import { useGetAvailablePEAQ } from '@/hooks/useGetAvailablePEAQ';
import { useNativeBalance } from '@/hooks/useNativeBalance';
import { peaqChain, VALID_CHAIN_ID } from '@/lib/chain';

const withdrawFormSchema = z.object({
  amount: z.string().min(1, {
    message: 'Amount must be at least 1 character.',
  }),
});

type WithdrawFormValues = z.infer<typeof withdrawFormSchema>;

const defaultValues: Partial<WithdrawFormValues> = {
  amount: '',
};

export const AdminWithdraw = () => {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues,
  });
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  const { availablePEAQ, refetch } = useGetAvailablePEAQ();
  const { nativeBalance, setNativeBalance } = useNativeBalance(address);

  if (!ready) return null;

  const onSubmit = async (values: WithdrawFormValues) => {
    setIsWithdrawing(true);

    try {
      const ethereumProvider = await wallet?.getEthereumProvider();

      const walletClient = await createWalletClient({
        account: address,
        chain: peaqChain,
        transport: custom(ethereumProvider),
      });

      const collator =
        '0xA87FC0eCA03920FFD5662F0c09499107A7700299' as `0x${string}`;

      const { request } = await publicClient.simulateContract({
        address: liquidStakingAddress,
        abi: liquidStakingAbi,
        functionName: 'withdrawStakedPEAQ',
        args: [BigInt(Math.floor(parseFloat(values.amount) * 1e18)), collator],
        account: address,
      });

      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      toast.success(`${values.amount} PEAQ withdrawn`);
      await refetch();
      setIsWithdrawing(false);
      form.reset();

      // Update native balance after successful withdrawal
      setNativeBalance(
        (
          BigInt(nativeBalance) +
          BigInt(Math.floor(parseFloat(values.amount) * 1e18))
        ).toString()
      );
    } catch (e) {
      console.error(e);
      toast.error('Error withdrawing PEAQ');
      setIsWithdrawing(false);
    }
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  const handleAmountChange = (value: string) => {
    if (!value || isNaN(parseFloat(value))) {
      setWithdrawAmount('0');
      return;
    }
    setWithdrawAmount(parseFloat(value).toFixed(3));
  };

  return (
    <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl">
      <div className="flex justify-center p-8">
        <div className="w-1/2 flex flex-col text-center">
          <div className="text-xs">Available for withdrawal</div>
          <div className="text-xl font-bold">
            {(parseFloat(availablePEAQ) / 1e18).toFixed(3)} PEAQ
          </div>
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left flex justify-start">
                      Amount of PEAQ to withdraw
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
                  disabled={
                    isWithdrawing ||
                    parseFloat(availablePEAQ) <
                      parseFloat(withdrawAmount) * 1e18
                  }
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              )}
            </form>
          </Form>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <div>Withdrawal amount</div>
              <div>{withdrawAmount} PEAQ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
