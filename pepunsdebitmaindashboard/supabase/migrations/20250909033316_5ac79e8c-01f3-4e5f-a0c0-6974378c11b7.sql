-- Insert mock user if not exists
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
) ON CONFLICT (wallet_address) DO NOTHING;

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
WHERE u.wallet_address = '0x547ce7516666c9587499C66Cf12d22237f6B11a6'
AND NOT EXISTS (
  SELECT 1 FROM public.transactions t2 
  WHERE t2.user_id = u.id
);