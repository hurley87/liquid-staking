import '@nomicfoundation/hardhat-toolbox-viem';

require('dotenv').config();

const config = {
  solidity: '0.8.28',
  networks: {
    'base-mainnet': {
      url: 'https://mainnet.base.org',
      accounts: [process.env.WALLET_KEY as string],
      gasPrice: 1000000000,
    },
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts: [process.env.WALLET_KEY as string],
      gasPrice: 1000000000,
    },
    agung: {
      url: process.env.AGUNG_RPC_URL,
      chainId: 9990,
      accounts: [process.env.WALLET_KEY as string],
    },
    peaq: {
      url: process.env.PEAQ_RPC_URL,
      chainId: 3338,
      accounts: [process.env.WALLET_KEY as string],
    },
  },
  etherscan: {
    apiKey: {
      'base-mainnet': process.env.ETHERSCAN_KEY,
      'base-sepolia': process.env.ETHERSCAN_KEY,
      agung: process.env.SUBSCAN_KEY,
      peaq: process.env.SUBSCAN_KEY,
    },
    customChains: [
      {
        network: 'base-mainnet',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'base-sepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
      {
        network: 'agung',
        chainId: 9990,
        urls: {
          apiURL: 'https://agung.subscan.io/api/v2/scan',
          browserURL: 'https://agung.subscan.io',
        },
      },
      {
        network: 'peaq',
        chainId: 3338,
        urls: {
          apiURL: 'https://peaq.subscan.io/api/v2/scan',
          browserURL: 'https://peaq.subscan.io',
        },
      },
    ],
  },
  defaultNetwork: 'hardhat',
};

export default config;
