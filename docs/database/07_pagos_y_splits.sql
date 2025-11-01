-- Types
DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM ('HELD','RELEASED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING','APPROVED','REJECTED','REFUNDED','CHARGED_BACK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('REQUESTED','APPROVED','REJECTED','PROCESSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('PENDING','PAID','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payments, payment_accounts, payment_splits, payouts, refunds, app_fee_receipts

CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_sellers(user_id),
  provider text NOT NULL CHECK (provider = ANY (ARRAY['MERCADOPAGO','MOBBEX'])),
  config_json jsonb NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  provider text NOT NULL CHECK (provider = ANY (ARRAY['MERCADOPAGO','MOBBEX'])),
  provider_pref_id text,
  provider_pay_id text,
  status payment_status NOT NULL,
  amount numeric(12,2) NOT NULL,
  payer_user_id uuid NOT NULL REFERENCES public.user_buyers(user_id),
  received_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  raw_payload jsonb
);

CREATE TABLE IF NOT EXISTS public.payment_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id),
  seller_account_id uuid NOT NULL REFERENCES public.payment_accounts(id),
  gross_amount numeric(12,2) NOT NULL,
  app_fee_amount numeric(12,2) DEFAULT 0,
  net_amount numeric(12,2) NOT NULL,
  escrow_status escrow_status NOT NULL DEFAULT 'HELD',
  provider_split_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id uuid NOT NULL REFERENCES public.payment_splits(id),
  status payout_status NOT NULL,
  amount numeric(12,2) NOT NULL,
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id),
  split_id uuid REFERENCES public.payment_splits(id),
  amount numeric(12,2) NOT NULL,
  status refund_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  raw_payload jsonb
);

CREATE TABLE IF NOT EXISTS public.app_fee_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id uuid NOT NULL REFERENCES public.payment_splits(id),
  status payout_status NOT NULL,
  amount numeric(12,2) NOT NULL,
  received_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_fee_receipts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Policies: payment_accounts
DROP POLICY IF EXISTS "Owners can read own payment accounts" ON public.payment_accounts;
CREATE POLICY "Owners can read own payment accounts" ON public.payment_accounts FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all payment accounts" ON public.payment_accounts;
CREATE POLICY "Admins can read all payment accounts" ON public.payment_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));
DROP POLICY IF EXISTS "Sellers can create own payment accounts" ON public.payment_accounts;
CREATE POLICY "Sellers can create own payment accounts" ON public.payment_accounts FOR INSERT WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_sellers s WHERE s.user_id=auth.uid()));
DROP POLICY IF EXISTS "Owners can update own payment accounts" ON public.payment_accounts;
CREATE POLICY "Owners can update own payment accounts" ON public.payment_accounts FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Owners can delete own payment accounts" ON public.payment_accounts;
CREATE POLICY "Owners can delete own payment accounts" ON public.payment_accounts FOR DELETE USING (user_id = auth.uid());

-- Policies: payments
DROP POLICY IF EXISTS "Buyers can read own payments" ON public.payments;
CREATE POLICY "Buyers can read own payments" ON public.payments FOR SELECT USING (payer_user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all payments" ON public.payments;
CREATE POLICY "Admins can read all payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: payment_splits
DROP POLICY IF EXISTS "Sellers can read own payment splits" ON public.payment_splits;
CREATE POLICY "Sellers can read own payment splits" ON public.payment_splits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.payment_accounts pa WHERE pa.id = public.payment_splits.seller_account_id AND pa.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can read all payment splits" ON public.payment_splits;
CREATE POLICY "Admins can read all payment splits" ON public.payment_splits FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: payouts
DROP POLICY IF EXISTS "Sellers can read own payouts" ON public.payouts;
CREATE POLICY "Sellers can read own payouts" ON public.payouts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payment_splits ps JOIN public.payment_accounts pa ON pa.id = ps.seller_account_id
    WHERE ps.id = public.payouts.split_id AND pa.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins can read all payouts" ON public.payouts;
CREATE POLICY "Admins can read all payouts" ON public.payouts FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: refunds
DROP POLICY IF EXISTS "Sellers can read own refunds" ON public.refunds;
CREATE POLICY "Sellers can read own refunds" ON public.refunds FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payment_splits ps JOIN public.payment_accounts pa ON pa.id = ps.seller_account_id
    WHERE ps.id = public.refunds.split_id AND pa.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Buyers can read refunds of their payments" ON public.refunds;
CREATE POLICY "Buyers can read refunds of their payments" ON public.refunds FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.payments p WHERE p.id = public.refunds.payment_id AND p.payer_user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can read all refunds" ON public.refunds;
CREATE POLICY "Admins can read all refunds" ON public.refunds FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: app_fee_receipts
DROP POLICY IF EXISTS "Sellers can read own app fee receipts" ON public.app_fee_receipts;
CREATE POLICY "Sellers can read own app fee receipts" ON public.app_fee_receipts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payment_splits ps JOIN public.payment_accounts pa ON pa.id = ps.seller_account_id
    WHERE ps.id = public.app_fee_receipts.split_id AND pa.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins can read all app fee receipts" ON public.app_fee_receipts;
CREATE POLICY "Admins can read all app fee receipts" ON public.app_fee_receipts FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));
