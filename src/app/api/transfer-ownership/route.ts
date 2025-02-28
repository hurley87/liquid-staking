import { NextRequest } from 'next/server';
import { createWalletClient, http, isAddress } from 'viem';
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
    const { newOwner } = await req.json();

    if (!newOwner || !isAddress(newOwner)) {
      return new Response(
        JSON.stringify({ error: 'Invalid address provided' }),
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

    const { request } = await publicClient.simulateContract({
      account,
      address: liquidStakingAddress,
      abi: liquidStakingAbi,
      functionName: 'transferOwnership',
      args: [newOwner as `0x${string}`],
    });

    const hash = await walletClient.writeContract(request);

    console.log('Transaction hash:', hash);

    return new Response(JSON.stringify({ success: true, hash }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error transferring ownership:', e);
    return new Response(
      JSON.stringify({
        error: 'An error occurred while transferring ownership',
        details: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
