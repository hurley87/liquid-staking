import { createPublicClient, http } from 'viem';
import { peaqChain, DEFAULT_RPC_URL } from './chain';

export const publicClient = createPublicClient({
  chain: peaqChain,
  transport: http(DEFAULT_RPC_URL),
});
