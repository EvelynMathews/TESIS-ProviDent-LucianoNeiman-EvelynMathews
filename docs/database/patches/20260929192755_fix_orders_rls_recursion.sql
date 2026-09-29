-- Fix: infinite recursion between orders and order_items policies
-- Date: 2026-09-29
-- Description: "Sellers can read orders with own products" (orders) reads order_items and
-- "Buyers can read items of own orders" (order_items) reads orders, so any select on
-- orders, order_items or addresses failed with "infinite recursion detected".
-- The checks move to SECURITY DEFINER helpers (same approach as is_admin).

CREATE OR REPLACE FUNCTION public.is_order_buyer(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = _order_id AND o.buyer_user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_order_seller(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = _order_id AND p.owner_user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Buyers can read items of own orders" ON public.order_items;
CREATE POLICY "Buyers can read items of own orders" ON public.order_items FOR SELECT USING (public.is_order_buyer(order_id));

DROP POLICY IF EXISTS "Sellers can read orders with own products" ON public.orders;
CREATE POLICY "Sellers can read orders with own products" ON public.orders FOR SELECT USING (public.is_order_seller(id));
