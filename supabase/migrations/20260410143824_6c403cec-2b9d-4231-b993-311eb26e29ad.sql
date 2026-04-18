
ALTER TABLE public.transactions
ADD COLUMN withdrawal_method text,
ADD COLUMN upi_id text,
ADD COLUMN bank_account_number text,
ADD COLUMN bank_ifsc text,
ADD COLUMN bank_name text,
ADD COLUMN account_holder_name text;
