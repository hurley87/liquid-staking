'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi } from '@/lib/LiquidStaking';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { toast } from 'sonner';
import { useBalance } from '@/hooks/useBalance';
import { useNativeBalance } from '@/hooks/useNativeBalance';
import { peaqChain, VALID_CHAIN_ID } from '@/lib/chain';

export const WithdrawalsClaim = () => {
  const { user, login, ready } = usePrivy();
  const address = user?.wallet?.address as `0x${string}`;
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    { amount: bigint; unlockTime: bigint }[]
  >([]);
  const [claimableIndices, setClaimableIndices] = useState<boolean[]>([]);
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const chainId = wallet?.chainId?.split(':')[1];
  const { balance } = useBalance(address);
  const { nativeBalance, setNativeBalance } = useNativeBalance(address);

  const fetchWithdrawalRequests = async (address: `0x${string}`) => {
    if (!address) return;

    try {
      const requests = (await publicClient.readContract({
        address: liquidStakingAddress,
        abi: liquidStakingAbi,
        functionName: 'getWithdrawalRequests',
        args: [address],
      })) as { amount: bigint; unlockTime: bigint }[];

      setWithdrawalRequests(requests);

      // Check which requests are claimable
      const claimablePromises = requests.map((_, index) =>
        publicClient.readContract({
          address: liquidStakingAddress,
          abi: liquidStakingAbi,
          functionName: 'isWithdrawalClaimable',
          args: [address, BigInt(index)],
        })
      );

      const claimable = await Promise.all(claimablePromises);
      setClaimableIndices(claimable as boolean[]);
    } catch (e) {
      console.error('Error fetching withdrawal requests:', e);
      toast.error('Error fetching withdrawal requests');
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests(address);
  }, [address]);

  const handleClaim = async (index: number) => {
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
        functionName: 'claimWithdrawal',
        args: [BigInt(index)],
        account: address,
      });

      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      // Update native balance after successful claim
      const claimedAmount = withdrawalRequests[index].amount;
      setNativeBalance((BigInt(nativeBalance) + claimedAmount).toString());

      toast.success('Successfully claimed withdrawal');
      fetchWithdrawalRequests(address);
    } catch (e) {
      console.error('Error claiming withdrawal:', e);
      toast.error('Error claiming withdrawal');
    } finally {
      setIsRequesting(false);
    }
  };

  const switchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await wallet?.switchChain(parseInt(VALID_CHAIN_ID));
    setIsSwitchingNetwork(false);
  };

  if (!ready) return null;

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
          {withdrawalRequests.length === 0 ? (
            <div className="text-center text-gray-500">
              No withdrawal requests found
            </div>
          ) : (
            withdrawalRequests.map((request, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span>{(Number(request.amount) / 1e18).toFixed(3)} PEAQ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unlock time:</span>
                  <span>
                    {new Date(
                      Number(request.unlockTime) * 1000
                    ).toLocaleString()}
                  </span>
                </div>
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
                    onClick={() => handleClaim(index)}
                    className="w-full"
                    disabled={!claimableIndices[index] || isRequesting}
                  >
                    {isRequesting
                      ? 'Claiming...'
                      : claimableIndices[index]
                      ? 'Claim'
                      : 'Not yet claimable'}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
