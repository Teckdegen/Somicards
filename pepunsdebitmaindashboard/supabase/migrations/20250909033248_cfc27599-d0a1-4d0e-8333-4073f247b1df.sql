-- Create users table with proper structure for PEPUNS X PENK debit cards
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  card_number TEXT,
  expiry_date TEXT,
  cvv TEXT,
  billing_address TEXT,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create function to set current wallet address for RLS
CREATE OR REPLACE FUNCTION public.set_current_wallet_address(wallet_addr TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_wallet_address', wallet_addr, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies for users table
CREATE POLICY "Enable read access for wallet owners" ON public.users
  FOR SELECT USING (wallet_address = current_setting('app.current_wallet_address', true));

CREATE POLICY "Enable insert for wallet owners" ON public.users
  FOR INSERT WITH CHECK (wallet_address = current_setting('app.current_wallet_address', true));

CREATE POLICY "Enable update for wallet owners" ON public.users
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet_address', true))
  WITH CHECK (wallet_address = current_setting('app.current_wallet_address', true));

-- RLS Policies for transactions table
CREATE POLICY "Enable all for transaction owners" ON public.transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = transactions.user_id 
      AND users.wallet_address = current_setting('app.current_wallet_address', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = transactions.user_id 
      AND users.wallet_address = current_setting('app.current_wallet_address', true)
    )
  );

-- Insert mock user
INSERT INTO public.users (
  wallet_address,
  full_name,
  card_number,
  expiry_date,
  cvv,
  billing_address,
  balance
) VALUES (
  '0x547ce7516666c9587499C66Cf12d22237f6B11a6',
  'Alex Johnson',
  '4532 1234 5678 9012',
  '12/27',
  '123',
  '123 Crypto Street, Blockchain City, BC 12345',
  75000.00
);

-- Insert mock transactions for the user
INSERT INTO public.transactions (user_id, tx_hash, amount, status, created_at)
SELECT 
  u.id,
  '0x' || encode(gen_random_bytes(32), 'hex'),
  amount_val,
  status_val,
  created_val
FROM public.users u,
UNNEST(
  ARRAY[50000, 25000, 100000, 15000, 80000],
  ARRAY['confirmed', 'confirmed', 'failed', 'confirmed', 'confirmed'],
  ARRAY[
    now() - interval '5 days',
    now() - interval '3 days', 
    now() - interval '2 days',
    now() - interval '1 day',
    now() - interval '6 hours'
  ]
) AS t(amount_val, status_val, created_val)
WHERE u.wallet_address = '0x547ce7516666c9587499C66Cf12d22237f6B11a6';