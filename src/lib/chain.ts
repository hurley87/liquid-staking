import { defineChain } from 'viem';

/**
 * Peaq chain configuration
 * Chain ID: 3338
 */
export const peaqChain = defineChain({
  id: 3338,
  name: 'Peaq',
  nativeCurrency: {
    decimals: 18,
    name: 'PEAQ',
    symbol: 'PEAQ',
  },
  rpcUrls: {
    default: {
      http: ['https://peaq.api.onfinality.io/public'],
    },
  },
});

/**
 * Default RPC URL for Peaq network
 */
export const DEFAULT_RPC_URL = 'https://peaq.api.onfinality.io/public';

/**
 * Valid chain ID for the Peaq network as a string
 * Used for chain validation in components
 */
export const VALID_CHAIN_ID = '3338';
