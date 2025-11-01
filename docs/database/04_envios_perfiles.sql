-- 04_envios_perfiles.sql
-- Shipping profiles, zones, rates and product_shipping_profiles

CREATE TABLE IF NOT EXISTS public.shipping_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL REFERENCES public.user_sellers(user_id),
  name text NOT NULL,
  active boolean DEFAULT true,
  volume_min_cm3 numeric(12,2),
  volume_max_cm3 numeric(12,2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.shipping_profiles(id),
  province_id uuid NOT NULL REFERENCES public.provinces(id),
  postal_code_min text NOT NULL,
  postal_code_max text NOT NULL,
  zone_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.shipping_profiles(id),
  zone_id uuid REFERENCES public.shipping_zones(id),
  carrier text NOT NULL,
  service text NOT NULL,
  price numeric(12,2) NOT NULL,
  weight_min numeric(12,3),
  weight_max numeric(12,3),
  eta_days integer,
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_shipping_profiles (
  product_id uuid NOT NULL REFERENCES public.products(id),
  profile_id uuid NOT NULL REFERENCES public.shipping_profiles(id),
  PRIMARY KEY (product_id, profile_id)
);

-- RLS
ALTER TABLE public.shipping_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_shipping_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Owners can read own shipping profiles" ON public.shipping_profiles;
CREATE POLICY "Owners can read own shipping profiles" ON public.shipping_profiles FOR SELECT USING (seller_user_id = auth.uid());
DROP POLICY IF EXISTS "Sellers can create own shipping profiles" ON public.shipping_profiles;
CREATE POLICY "Sellers can create own shipping profiles" ON public.shipping_profiles FOR INSERT WITH CHECK (seller_user_id = auth.uid());
DROP POLICY IF EXISTS "Owners can update own shipping profiles" ON public.shipping_profiles;
CREATE POLICY "Owners can update own shipping profiles" ON public.shipping_profiles FOR UPDATE USING (seller_user_id = auth.uid());
DROP POLICY IF EXISTS "Owners can delete own shipping profiles" ON public.shipping_profiles;
CREATE POLICY "Owners can delete own shipping profiles" ON public.shipping_profiles FOR DELETE USING (seller_user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all shipping profiles" ON public.shipping_profiles;
CREATE POLICY "Admins can read all shipping profiles" ON public.shipping_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Sellers can manage zones of own profiles" ON public.shipping_zones;
CREATE POLICY "Sellers can manage zones of own profiles" ON public.shipping_zones FOR ALL USING (EXISTS (SELECT 1 FROM public.shipping_profiles sp WHERE sp.id=profile_id AND sp.seller_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.shipping_profiles sp WHERE sp.id=profile_id AND sp.seller_user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins can read all shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can read all shipping zones" ON public.shipping_zones FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Sellers can manage rates of own profiles" ON public.shipping_rates;
CREATE POLICY "Sellers can manage rates of own profiles" ON public.shipping_rates FOR ALL USING (EXISTS (SELECT 1 FROM public.shipping_profiles sp WHERE sp.id=profile_id AND sp.seller_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.shipping_profiles sp WHERE sp.id=profile_id AND sp.seller_user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins can read all shipping rates" ON public.shipping_rates;
CREATE POLICY "Admins can read all shipping rates" ON public.shipping_rates FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: product_shipping_profiles
DROP POLICY IF EXISTS "Anyone can read product shipping profiles" ON public.product_shipping_profiles;
CREATE POLICY "Anyone can read product shipping profiles" ON public.product_shipping_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can manage product shipping profiles" ON public.product_shipping_profiles;
CREATE POLICY "Owners can manage product shipping profiles" ON public.product_shipping_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())
  AND EXISTS (SELECT 1 FROM public.shipping_profiles sp WHERE sp.id=profile_id AND sp.seller_user_id=auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())
  AND EXISTS (SELECT 1 FROM public.shipping_profiles sp WHERE sp.id=profile_id AND sp.seller_user_id=auth.uid())
);
