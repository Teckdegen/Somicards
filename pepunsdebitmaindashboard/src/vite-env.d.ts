/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_PROJECT_ID: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_URL: string

  // Blockchain Configuration - Somnia Network
  readonly VITE_CHAIN_ID: string
  readonly VITE_CHAIN_NAME: string
  readonly VITE_CHAIN_NETWORK: string
  readonly VITE_RPC_URL: string
  readonly VITE_NATIVE_CURRENCY_NAME: string
  readonly VITE_NATIVE_CURRENCY_SYMBOL: string
  readonly VITE_NATIVE_CURRENCY_DECIMALS: string
  readonly VITE_BLOCK_EXPLORER_NAME: string
  readonly VITE_BLOCK_EXPLORER_URL: string

  // Wallet Configuration
  readonly VITE_WALLETCONNECT_PROJECT_ID: string

  // Treasury Configuration
  readonly VITE_TREASURY_ADDRESS: string

  // Backend API Configuration (for notifications)
  readonly VITE_BACKEND_WEBHOOK_URL: string
  readonly VITE_BACKEND_NOTIFICATION_ID: string

  // CoinGecko API Configuration
  readonly VITE_COINGECKO_API_URL: string
  readonly VITE_COINGECKO_API_KEY: string

  // Top-up Configuration (USD amounts)
  readonly VITE_TOP_UP_USD_AMOUNTS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}