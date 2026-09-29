-- Admin role: single source of truth in user_roles (is_admin)
-- Date: 2026-09-29
-- Description: The admin panel checked user_metadata.role while RLS checks user_roles.
-- Moves the admins to user_roles/user_admins, drops the metadata flag (users can edit it),
-- and lets admins update/delete any product.

-- 1) Move metadata admins to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'ADMIN'
FROM auth.users u
JOIN public.users pu ON pu.id = u.id
WHERE u.raw_user_meta_data->>'role' = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_admins (user_id)
SELECT u.id
FROM auth.users u
JOIN public.users pu ON pu.id = u.id
WHERE u.raw_user_meta_data->>'role' = 'admin'
ON CONFLICT DO NOTHING;

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data->>'role' = 'admin';

-- 2) Admin policies on products
DROP POLICY IF EXISTS "Admins can read all products" ON public.products;
CREATE POLICY "Admins can read all products" ON public.products FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
CREATE POLICY "Admins can update all products" ON public.products FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;
CREATE POLICY "Admins can delete all products" ON public.products FOR DELETE USING (public.is_admin(auth.uid()));

-- 3) Delete trigger cleans child rows regardless of who deletes the product.
-- It only runs for rows the products DELETE policy already allowed.
CREATE OR REPLACE FUNCTION public.handle_product_deleted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.product_prices WHERE product_id = OLD.id;
  DELETE FROM public.product_shipping_methods WHERE product_id = OLD.id;
  DELETE FROM public.product_images WHERE product_id = OLD.id;
  DELETE FROM public.prosthesis_products WHERE product_id = OLD.id;
  DELETE FROM public.supply_products WHERE product_id = OLD.id;
  DELETE FROM public.plaster_service_products WHERE product_id = OLD.id;
  DELETE FROM public.rental_pricing WHERE product_id = OLD.id;
  DELETE FROM public.rental_products WHERE product_id = OLD.id;
  RETURN OLD;
END $$;
