-- Run this in your Supabase SQL Editor

-- 1. Create the Assets table (for Portfolio)
CREATE TABLE public.assets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert starting portfolio
INSERT INTO public.assets (name, value, color) VALUES 
('Stocks', 45000, '#2dd4bf'),
('Mutual Funds', 35000, '#0ea5e9'),
('Savings Account', 18000, '#f59e0b'),
('Other Banking', 4500, '#8b5cf6');

-- 2. Create the Accounts table (for Bank Accounts)
CREATE TABLE public.accounts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert starting bank accounts
INSERT INTO public.accounts (name, type, balance) VALUES 
('Chase Checking', 'Checking', 3500),
('HDFC Savings', 'Savings', 18000),
('Amex Credit Card', 'Credit', -1200);

-- 3. Create Transactions table (for Dashboard Recent Activity)
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    date_label TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert starting transactions
INSERT INTO public.transactions (description, amount, type, date_label) VALUES 
('Stock Purchase (AAPL)', -1500, 'investment', 'Today'),
('Salary Deposit', 5500, 'income', 'Yesterday'),
('Mutual Fund SIP', -600, 'investment', 'Mar 15'),
('Grocery Store', -120, 'expense', 'Mar 14');
