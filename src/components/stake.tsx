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

export const Stake = () => {
  const { user, login, ready } = usePrivy();
  const [isStaking, setIsStaking] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];

  if (!ready) return null;

  const onSubmit = (values: AccountFormValues) => {
    console.log(values);
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl">
      <div className="flex p-8">
        <div className="w-full flex flex-col text-left">
          <div className="text-xs">Staked amount</div>
          <div className="text-xl font-bold">0 stPEAQ</div>
        </div>
        <div className="w-full flex flex-col text-left">
          <div className="text-xs">APR</div>
          <div className="text-xl font-bold">3.1%</div>
        </div>
      </div>
      <div className="w-full max-w-lg mx-auto border shadow-md rounded-3xl p-8 flex flex-col gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-left flex justify-start">
                    Amount
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!user ? (
              <Button onClick={login} className="w-full" size="lg" disabled>
                Connect Wallet
              </Button>
            ) : chainId !== VALID_CHAIN_ID ? (
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
                onClick={() => setIsStaking(true)}
              >
                {isStaking ? 'Staking...' : 'Stake'}
              </Button>
            )}
          </form>
        </Form>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <div>You will receive</div>
            <div>0 stPEAQ</div>
          </div>
          <div className="flex justify-between">
            <div>Exchange rate</div>
            <div>1 PEAQ = 1 stPEAQ</div>
          </div>
          <div className="flex justify-between">
            <div>Reward fee</div>
            <div>10%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
