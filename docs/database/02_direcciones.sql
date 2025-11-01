-- 02_direcciones.sql
-- Provinces and Addresses

CREATE TABLE IF NOT EXISTS public.provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  enabled boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_buyers(user_id),
  street text,
  city text NOT NULL,
  province_id uuid NOT NULL REFERENCES public.provinces(id),
  postal_code text,
  recipient_name text,
  tax_id text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Policies: provinces
DROP POLICY IF EXISTS "Authenticated users can read provinces catalog" ON public.provinces;
CREATE POLICY "Authenticated users can read provinces catalog" ON public.provinces FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage provinces catalog" ON public.provinces;
CREATE POLICY "Admins can manage provinces catalog" ON public.provinces FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: addresses
DROP POLICY IF EXISTS "Users can read own addresses" ON public.addresses;
CREATE POLICY "Users can read own addresses" ON public.addresses FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
CREATE POLICY "Users can create own addresses" ON public.addresses FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all addresses" ON public.addresses;
CREATE POLICY "Admins can read all addresses" ON public.addresses FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));
