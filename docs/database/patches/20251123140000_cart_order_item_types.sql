-- Migration: Add type-specific tables for cart_items and order_items
-- Date: 2025-11-23
-- Description: Creates specific tables for RENTAL and PLASTER_SERVICE cart/order items
--              to store custom data (dates/times for rentals, descriptions for plaster services)

-- ========================================
-- RENTAL CART ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.rental_cart_items (
  cart_item_id uuid PRIMARY KEY REFERENCES public.cart_items(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_days integer NOT NULL,
  calculated_price numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (total_days > 0),
  CONSTRAINT positive_price CHECK (calculated_price >= 0)
);

-- ========================================
-- PLASTER SERVICE CART ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.plaster_service_cart_items (
  cart_item_id uuid PRIMARY KEY REFERENCES public.cart_items(id) ON DELETE CASCADE,
  custom_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT description_not_empty CHECK (length(trim(custom_description)) > 0)
);

-- ========================================
-- RENTAL ORDER ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.rental_order_items (
  order_item_id uuid PRIMARY KEY REFERENCES public.order_items(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_days integer NOT NULL,
  calculated_price numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (total_days > 0),
  CONSTRAINT positive_price CHECK (calculated_price >= 0)
);

-- ========================================
-- PLASTER SERVICE ORDER ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.plaster_service_order_items (
  order_item_id uuid PRIMARY KEY REFERENCES public.order_items(id) ON DELETE CASCADE,
  custom_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT description_not_empty CHECK (length(trim(custom_description)) > 0)
);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.rental_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaster_service_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaster_service_order_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES: RENTAL CART ITEMS
-- ========================================
DROP POLICY IF EXISTS "Buyers can manage rental cart items of own carts" ON public.rental_cart_items;
CREATE POLICY "Buyers can manage rental cart items of own carts" ON public.rental_cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    WHERE ci.id = rental_cart_items.cart_item_id
    AND c.buyer_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    WHERE ci.id = rental_cart_items.cart_item_id
    AND c.buyer_user_id = auth.uid()
  )
);

-- ========================================
-- POLICIES: PLASTER SERVICE CART ITEMS
-- ========================================
DROP POLICY IF EXISTS "Buyers can manage plaster service cart items of own carts" ON public.plaster_service_cart_items;
CREATE POLICY "Buyers can manage plaster service cart items of own carts" ON public.plaster_service_cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    WHERE ci.id = plaster_service_cart_items.cart_item_id
    AND c.buyer_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    WHERE ci.id = plaster_service_cart_items.cart_item_id
    AND c.buyer_user_id = auth.uid()
  )
);

-- ========================================
-- POLICIES: RENTAL ORDER ITEMS
-- ========================================
DROP POLICY IF EXISTS "Buyers can read rental order items of own orders" ON public.rental_order_items;
CREATE POLICY "Buyers can read rental order items of own orders" ON public.rental_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = rental_order_items.order_item_id
    AND o.buyer_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can read all rental order items" ON public.rental_order_items;
CREATE POLICY "Admins can read all rental order items" ON public.rental_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid()
    AND r.role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Sellers can read rental order items of own products" ON public.rental_order_items;
CREATE POLICY "Sellers can read rental order items of own products" ON public.rental_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.id = rental_order_items.order_item_id
    AND p.owner_user_id = auth.uid()
  )
);

-- ========================================
-- POLICIES: PLASTER SERVICE ORDER ITEMS
-- ========================================
DROP POLICY IF EXISTS "Buyers can read plaster service order items of own orders" ON public.plaster_service_order_items;
CREATE POLICY "Buyers can read plaster service order items of own orders" ON public.plaster_service_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = plaster_service_order_items.order_item_id
    AND o.buyer_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can read all plaster service order items" ON public.plaster_service_order_items;
CREATE POLICY "Admins can read all plaster service order items" ON public.plaster_service_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid()
    AND r.role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Sellers can read plaster service order items of own products" ON public.plaster_service_order_items;
CREATE POLICY "Sellers can read plaster service order items of own products" ON public.plaster_service_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.id = plaster_service_order_items.order_item_id
    AND p.owner_user_id = auth.uid()
  )
);

-- ========================================
-- INDEXES (optional, for performance)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_rental_cart_items_dates ON public.rental_cart_items(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rental_order_items_dates ON public.rental_order_items(start_date, end_date);
