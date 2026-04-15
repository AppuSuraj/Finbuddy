-- Run this in your Supabase SQL Editor to fix the Importer forever.

-- 1. Update Assets table with missing columns
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS broker TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS buy_price NUMERIC;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS sector TEXT;

-- 2. Optional: Enable Row Level Security (RLS) 
-- This ensures you only see your own data if multiple users use the app
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- If policy exists, drop it first to avoid errors
DROP POLICY IF EXISTS "Users can manage their own assets" ON public.assets;

CREATE POLICY "Users can manage their own assets" ON public.assets
FOR ALL USING (auth.uid() = user_id);


-- 3. Update existing tables (Accounts & Transactions) similarly
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.accounts;
CREATE POLICY "Users can manage their own accounts" ON public.accounts
FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions
FOR ALL USING (auth.uid() = user_id);
