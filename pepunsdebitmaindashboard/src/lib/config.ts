// Configuration for the debit card system

export const CONFIG = {
  // Treasury wallet address where top-ups will be sent
  TREASURY_ADDRESS: import.meta.env.VITE_TREASURY_ADDRESS || '0x582ca7856CEbAbC9eE62E24a7b8D1Bb2fF9814aa',
  
  // Backend API Configuration (for notifications)
  BACKEND_API: {
    WEBHOOK_URL: import.meta.env.VITE_BACKEND_WEBHOOK_URL || '',
    NOTIFICATION_ID: import.meta.env.VITE_BACKEND_NOTIFICATION_ID || '',
  },
  
  // CoinGecko API Configuration
  COINGECKO: {
    API_URL: import.meta.env.VITE_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
    API_KEY: import.meta.env.VITE_COINGECKO_API_KEY || '',
  },
  
  // Top-up configuration (USD amounts)
  TOP_UP: {
    USD_AMOUNTS: (import.meta.env.VITE_TOP_UP_USD_AMOUNTS || '50,100,200,500,1000').split(',').map(Number),
  },
  
  // Blockchain Configuration
  CHAIN: {
    ID: Number(import.meta.env.VITE_CHAIN_ID) || 5031,
    NAME: import.meta.env.VITE_CHAIN_NAME || 'Somnia',
    RPC_URL: import.meta.env.VITE_RPC_URL || 'https://api.infra.mainnet.somnia.network/',
    CURRENCY_SYMBOL: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL || 'SOM',
  },
};

// Helper function to get treasury address
export const getTreasuryAddress = () => {
  if (!CONFIG.TREASURY_ADDRESS) {
    console.warn('⚠️  Treasury address not configured! Please update VITE_TREASURY_ADDRESS in .env');
  }
  return CONFIG.TREASURY_ADDRESS;
};

// Helper function to check if backend API is configured
export const isBackendApiConfigured = () => {
  return !!CONFIG.BACKEND_API.WEBHOOK_URL && !!CONFIG.BACKEND_API.NOTIFICATION_ID;
};

// Helper function to get SOM price from CoinGecko
export const getSomPrice = async (): Promise<number> => {
  try {
    const response = await fetch(`${CONFIG.COINGECKO.API_URL}/simple/price?ids=somnia&vs_currencies=usd`, {
      headers: CONFIG.COINGECKO.API_KEY ? {
        'X-CG-Demo-API-Key': CONFIG.COINGECKO.API_KEY
      } : {}
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch SOM price');
    }
    
    const data = await response.json();
    return data.somnia?.usd || 0.01; // Fallback price if not found
  } catch (error) {
    console.warn('⚠️  Failed to fetch SOM price from CoinGecko, using fallback price');
    return 0.01; // Fallback price
  }
};

// Helper function to calculate SOM amount from USD
export const calculateSomAmount = (usdAmount: number, somPrice: number): number => {
  return usdAmount / somPrice;
};
