import { NextRequest } from 'next/server';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAddress, liquidStakingAbi } from '@/lib/LiquidStaking';
import { peaqChain, DEFAULT_RPC_URL } from '@/lib/chain';

const walletClient = createWalletClient({
  chain: peaqChain,
  transport: http(DEFAULT_RPC_URL),
});

export async function POST(req: NextRequest) {
  try {
    const { limit } = await req.json();

    if (!limit || isNaN(Number(limit))) {
      return new Response(
        JSON.stringify({ error: 'Invalid staking limit provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
    const limitInWei = parseEther(limit.toString());

    const { request } = await publicClient.simulateContract({
      account,
      address: liquidStakingAddress,
      abi: liquidStakingAbi,
      functionName: 'setStakingLimit',
      args: [limitInWei],
    });

    const hash = await walletClient.writeContract(request);

    console.log('Transaction hash:', hash);

    return new Response(JSON.stringify({ success: true, hash }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error setting staking limit:', e);
    return new Response(
      JSON.stringify({
        error: 'An error occurred while setting staking limit',
        details: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
