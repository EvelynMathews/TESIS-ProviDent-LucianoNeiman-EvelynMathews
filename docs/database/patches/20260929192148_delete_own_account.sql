-- Users can delete their own account
-- Date: 2026-09-29
-- Description: delete_own_account() lets the logged user delete their auth user.
-- Blocked when the user has orders (as buyer) or sales (orders with their products),
-- because those records must be kept. Deleting auth.users fires cleanup_user.
-- cleanup_user now also removes payment_accounts, which blocked deleting sellers.

CREATE OR REPLACE FUNCTION public.cleanup_user(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Products owned by seller
  DELETE FROM public.products WHERE owner_user_id = p_user;

  -- Shipping methods (zones and rates cascade)
  DELETE FROM public.shipping_methods     WHERE seller_user_id = p_user;

  -- Payment accounts
  DELETE FROM public.payment_accounts     WHERE user_id = p_user;

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

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders WHERE buyer_user_id = uid)
     OR EXISTS (
       SELECT 1 FROM public.order_items oi
       JOIN public.products p ON p.id = oi.product_id
       WHERE p.owner_user_id = uid
     ) THEN
    RAISE EXCEPTION 'has_orders';
  END IF;

  DELETE FROM auth.users WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
