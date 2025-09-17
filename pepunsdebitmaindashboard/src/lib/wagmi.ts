import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';

// Somnia chain configuration
export const somniaChain = defineChain({
  id: Number(import.meta.env.VITE_CHAIN_ID) || 5031,
  name: import.meta.env.VITE_CHAIN_NAME || 'Somnia',
  network: import.meta.env.VITE_CHAIN_NETWORK || 'somnia',
  nativeCurrency: {
    decimals: Number(import.meta.env.VITE_NATIVE_CURRENCY_DECIMALS) || 18,
    name: import.meta.env.VITE_NATIVE_CURRENCY_NAME || 'SOM',
    symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL || 'SOM',
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_URL || 'https://api.infra.mainnet.somnia.network/'] },
    public: { http: [import.meta.env.VITE_RPC_URL || 'https://api.infra.mainnet.somnia.network/'] },
  },
  blockExplorers: {
    default: { 
      name: import.meta.env.VITE_BLOCK_EXPLORER_NAME || 'Somnia Explorer', 
      url: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://explorer.somnia.network' 
    },
  },
});

export const config = getDefaultConfig({
  appName: 'SOMI CARDS',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [somniaChain],
  transports: {
    [somniaChain.id]: http(),
  },
});
