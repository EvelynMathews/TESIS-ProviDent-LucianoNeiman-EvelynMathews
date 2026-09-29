-- Fix: cleanup_user still referenced shipping_profiles (replaced by shipping_methods)
-- Date: 2026-09-29
-- Description: Deleting any user failed with "relation public.shipping_profiles does not exist".
-- shipping_zones and shipping_rates cascade from shipping_methods.

CREATE OR REPLACE FUNCTION public.cleanup_user(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Products owned by seller
  DELETE FROM public.products WHERE owner_user_id = p_user;

  -- Shipping methods (zones and rates cascade)
  DELETE FROM public.shipping_methods     WHERE seller_user_id = p_user;

  -- Buyer artifacts
  DELETE FROM public.cart_items           WHERE cart_id IN (SELECT id FROM public.carts WHERE buyer_user_id = p_user);
  DELETE FROM public.carts                WHERE buyer_user_id = p_user;
  DELETE FROM public.addresses            WHERE user_id = p_user;

  -- Admin content
  DELETE FROM public.news_images          WHERE news_id IN (SELECT id FROM public.news WHERE admin_user_id = p_user);
  DELETE FROM public.news                 WHERE admin_user_id = p_user;

  -- Subtypes & roles & profile
  DELETE FROM public.user_admins          WHERE user_id = p_user;
  DELETE FROM public.user_sellers         WHERE user_id = p_user;
  DELETE FROM public.user_buyers          WHERE user_id = p_user;
  DELETE FROM public.user_roles           WHERE user_id = p_user;
  DELETE FROM public.user_profiles        WHERE user_id = p_user;
END $$;
