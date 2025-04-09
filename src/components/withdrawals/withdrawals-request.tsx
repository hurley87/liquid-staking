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
import { useBalance } from '@/hooks/useBalance';
import { useNativeBalance } from '@/hooks/useNativeBalance';
import { peaqChain, VALID_CHAIN_ID } from '@/lib/chain';

type AccountFormValues = {
  amount: string;
};

const defaultValues: Partial<AccountFormValues> = {
  amount: '',
};

export const WithdrawalsRequest = () => {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const { balance, setBalance } = useBalance(address);
  const { nativeBalance } = useNativeBalance(address);

  const accountFormSchema = z.object({
    amount: z
      .string()
      .min(1, {
        message: 'Amount must be at least 1 character.',
      })
      .refine((val: string) => !isNaN(parseFloat(val)), {
        message: 'Please enter a valid number',
      })
      .refine(
        (val: string) => {
          const amount = parseFloat(val);
          const maxAmount = parseFloat(balance) / 1e18;
          return amount <= maxAmount;
        },
        {
          message: 'Amount exceeds available balance',
        }
      ),
  });

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];
  const [withdrawalAmount, setWithdrawalAmount] = useState('0');

  if (!ready) return null;

  const onSubmit = async (values: AccountFormValues) => {
    setIsRequesting(true);

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
        functionName: 'requestWithdrawal',
        args: [BigInt(Math.floor(parseFloat(values.amount) * 1e18))],
        account: address,
      });

      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      toast.success(`Requested withdrawal of ${values.amount} stPEAQ`);

      setIsRequesting(false);
      setBalance(
        (parseFloat(balance) - parseFloat(values.amount) * 1e18).toFixed(3)
      );
    } catch (e) {
      console.log(e);
      toast.error('Error requesting withdrawal');
      setIsRequesting(false);
    }
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  const handleAmountChange = (value: string) => {
    if (!value || isNaN(parseFloat(value))) {
      setWithdrawalAmount('0');
      form.setValue('amount', '0', { shouldValidate: true });
      return;
    }

    const maxAmount = parseFloat(balance) / 1e18;
    const inputAmount = parseFloat(value);

    // If the input amount is higher than max, use the max amount
    if (inputAmount > maxAmount) {
      setWithdrawalAmount(maxAmount.toString());
      form.setValue('amount', maxAmount.toString(), { shouldValidate: true });
      return;
    }

    // Otherwise use the input amount
    setWithdrawalAmount(value);
    form.setValue('amount', value, { shouldValidate: true });
  };

  const handleMaxAmount = () => {
    const maxAmount = (parseFloat(balance) / 1e18).toString();
    form.setValue('amount', maxAmount, { shouldValidate: true });
    setWithdrawalAmount(maxAmount);
  };

  return (
    <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl">
      <div className="flex p-8">
        <div className="w-1/2 flex flex-col text-center">
          <div className="text-xs">Available stPEAQ</div>
          <div className="text-xl font-bold">
            {(parseFloat(balance) / 1e18).toFixed(3)} stPEAQ
          </div>
        </div>
        <div className="w-1/2 flex flex-col text-center">
          <div className="text-xs">Current PEAQ</div>
          <div className="text-xl font-bold">
            {(parseFloat(nativeBalance) / 1e18).toFixed(3)} PEAQ
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
                      Amount of stPEAQ to withdraw
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleAmountChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMaxAmount}
                        className="whitespace-nowrap p-4"
                      >
                        Max
                      </Button>
                    </div>
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
                    isRequesting ||
                    parseFloat(balance) < parseFloat(withdrawalAmount) * 1e18
                  }
                >
                  {isRequesting ? 'Requesting...' : 'Request Withdrawal'}
                </Button>
              )}
            </form>
          </Form>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <div>You will receive</div>
              <div>{withdrawalAmount} PEAQ</div>
            </div>
            <div className="flex justify-between">
              <div>Exchange rate</div>
              <div>1 stPEAQ = 1 PEAQ</div>
            </div>
            <div className="flex justify-between">
              <div>Withdrawal delay</div>
              <div>3 days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
