-- Deleting an account no longer fails when its products are in other people's carts
-- Date: 2026-11-05
-- Description: cart_items -> products has no ON DELETE, so cleanup_user failed when a
-- seller's product was in another buyer's cart. Those cart items are removed first.
-- Orders are not touched: delete_own_account already blocks users with orders or sales.

CREATE OR REPLACE FUNCTION public.cleanup_user(p_user uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Other buyers' cart items with this seller's products (they would block the delete)
  DELETE FROM public.cart_items WHERE product_id IN (SELECT id FROM public.products WHERE owner_user_id = p_user);

  -- Products owned by seller (cascades product children via product trigger)
  DELETE FROM public.products WHERE owner_user_id = p_user;

  -- Shipping methods (zones and rates cascade)
  DELETE FROM public.shipping_methods     WHERE seller_user_id = p_user;

  -- Payment accounts
  DELETE FROM public.payment_accounts     WHERE user_id = p_user;

  -- Buyer related artifacts
  DELETE FROM public.cart_items           WHERE cart_id IN (SELECT id FROM public.carts WHERE buyer_user_id = p_user);
  DELETE FROM public.carts                WHERE buyer_user_id = p_user;
  DELETE FROM public.addresses            WHERE user_id = p_user;

  -- Admin authored content
  DELETE FROM public.news_images          WHERE news_id IN (SELECT id FROM public.news WHERE admin_user_id = p_user);
  DELETE FROM public.news                 WHERE admin_user_id = p_user;

  -- Subtypes and roles
  DELETE FROM public.user_admins          WHERE user_id = p_user;
  DELETE FROM public.user_sellers         WHERE user_id = p_user;
  DELETE FROM public.user_buyers          WHERE user_id = p_user;
  DELETE FROM public.user_roles           WHERE user_id = p_user;
  DELETE FROM public.user_profiles        WHERE user_id = p_user;
END $$;
