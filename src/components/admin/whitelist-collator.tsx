'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi, liquidStakingAddress } from '@/lib/LiquidStaking';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { peaqChain, VALID_CHAIN_ID } from '@/lib/chain';

const formSchema = z.object({
  collatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Please enter a valid Ethereum address',
  }),
  status: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function WhitelistCollator() {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collatorAddress: '',
      status: true,
    },
  });

  if (!ready) return null;

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

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
        functionName: 'setCollatorWhitelist',
        args: [data.collatorAddress, data.status],
        account: address,
      });

      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      toast.success(
        `Collator ${
          data.status ? 'whitelisted' : 'removed from whitelist'
        } successfully`
      );
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update collator whitelist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl border bg-card text-card-foreground shadow-md">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Manage Collator Whitelist
        </h3>
        <p className="text-sm text-muted-foreground">
          Add or remove collators from the whitelist
        </p>
      </div>

      <div className="p-6">
        {!user ? (
          <Button onClick={login} className="w-full" size="lg">
            Connect Wallet
          </Button>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="collatorAddress"
                render={({ field }) => (
                  <FormItem>
                    <div className="text-left w-full">Collator Address</div>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-3xl border p-4">
                    <div className="space-y-0.5">
                      <div className="text-base text-left w-full">
                        Whitelist Status
                      </div>
                      <FormDescription className="text-left">
                        Toggle to whitelist or remove from whitelist
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Update Whitelist'}
                </Button>
              )}
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
