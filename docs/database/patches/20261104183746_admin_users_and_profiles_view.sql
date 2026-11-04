-- Admin user management (activate / deactivate / edit) and profile view fix
-- Date: 2026-11-04
-- Description:
-- 1) public_user_profiles now returns bio and location. The app read them as empty
--    and editing the profile erased them.
-- 2) users.photo_url is dropped: always null, the photo lives in user_profiles.avatar.
-- 3) users.is_active is used to deactivate accounts. Only admins can change it,
--    deactivated users cannot publish, add to cart or create orders, and their
--    products are hidden from the catalog.
-- 4) Admins can edit user_profiles (bio, location).

-- 1) Profile view
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT
  u.id,
  u.first_name,
  u.last_name,
  p.avatar AS avatar_url,
  p.bio,
  p.location
FROM public.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
WHERE COALESCE(p.is_public, true) = true;

-- 2) Unused column
ALTER TABLE public.users DROP COLUMN IF EXISTS photo_url;

-- 3) Active accounts
UPDATE public.users SET is_active = true WHERE is_active IS NULL;
ALTER TABLE public.users ALTER COLUMN is_active SET NOT NULL;

CREATE OR REPLACE FUNCTION public.is_user_active(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.users WHERE id = _uid), false);
$$;

-- Users can edit their own row, but not their is_active flag
CREATE OR REPLACE FUNCTION public.protect_user_is_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'only admins can change is_active';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_user_is_active_change ON public.users;
CREATE TRIGGER on_user_is_active_change BEFORE UPDATE OF is_active ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_is_active();

-- Products of deactivated sellers are hidden (owners and admins still see them)
DROP POLICY IF EXISTS "Public can read active or owner sees own products" ON public.products;
CREATE POLICY "Public can read active or owner sees own products" ON public.products FOR SELECT
USING ((is_active AND public.is_user_active(owner_user_id)) OR owner_user_id = auth.uid());

-- Deactivated users cannot publish, add to cart or create orders
-- (RESTRICTIVE: applies on top of the existing permissive policies)
DROP POLICY IF EXISTS "Only active users can create products" ON public.products;
CREATE POLICY "Only active users can create products" ON public.products AS RESTRICTIVE FOR INSERT
WITH CHECK (public.is_user_active(auth.uid()));

DROP POLICY IF EXISTS "Only active users can add cart items" ON public.cart_items;
CREATE POLICY "Only active users can add cart items" ON public.cart_items AS RESTRICTIVE FOR INSERT
WITH CHECK (public.is_user_active(auth.uid()));

DROP POLICY IF EXISTS "Only active users can create orders" ON public.orders;
CREATE POLICY "Only active users can create orders" ON public.orders AS RESTRICTIVE FOR INSERT
WITH CHECK (public.is_user_active(auth.uid()));

-- 4) Admins can edit profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles FOR UPDATE
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
