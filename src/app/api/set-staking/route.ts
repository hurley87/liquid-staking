import { NextRequest } from 'next/server';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { publicClient } from '@/lib/publicClient';
import { stPEAQAddress, stPEAQAbi } from '@/lib/stPEAQ';
import { liquidStakingAddress } from '@/lib/LiquidStaking';
import { peaqChain, DEFAULT_RPC_URL } from '@/lib/chain';

const walletClient = createWalletClient({
  chain: peaqChain,
  transport: http(DEFAULT_RPC_URL),
});

export async function POST(req: NextRequest) {
  console.log('Setting staking contract', req);
  try {
    const privateKey = process.env.SERVER_PRIVATE_KEY;

    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: 'Server private key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const { request } = await publicClient.simulateContract({
      account,
      address: stPEAQAddress,
      abi: stPEAQAbi,
      functionName: 'setStakingContract',
      args: [liquidStakingAddress],
    });

    const hash = await walletClient.writeContract(request);

    console.log('Hash:', hash);

    return new Response(JSON.stringify({ success: true, hash }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error adding checkpoint:', e);
    return new Response(
      JSON.stringify({ error: 'An error occurred while adding checkpoint' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
