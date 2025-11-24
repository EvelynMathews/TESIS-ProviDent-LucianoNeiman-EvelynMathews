-- Types
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('CREATED','PAID','FULFILLED','CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Carts, cart_items, orders, order_items, and cross-visibility policies

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES public.user_buyers(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price_snapshot numeric(12,2) NOT NULL,
  options_json jsonb
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES public.user_buyers(user_id),
  shipping_address_id uuid NOT NULL REFERENCES public.addresses(id),
  billing_address_id uuid NOT NULL REFERENCES public.addresses(id),
  status order_status NOT NULL DEFAULT 'CREATED',
  total_amount numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  snapshot_json jsonb
);

-- RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Buyers can manage own carts" ON public.carts;
CREATE POLICY "Buyers can manage own carts" ON public.carts FOR ALL USING (buyer_user_id = auth.uid()) WITH CHECK (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS "Buyers can manage items of own carts" ON public.cart_items;
CREATE POLICY "Buyers can manage items of own carts" ON public.cart_items FOR ALL USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id=cart_id AND c.buyer_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id=cart_id AND c.buyer_user_id=auth.uid()));

DROP POLICY IF EXISTS "Buyers can read own orders" ON public.orders;
CREATE POLICY "Buyers can read own orders" ON public.orders FOR SELECT USING (buyer_user_id = auth.uid());
DROP POLICY IF EXISTS "Buyers can create own orders" ON public.orders;
CREATE POLICY "Buyers can create own orders" ON public.orders FOR INSERT WITH CHECK (buyer_user_id = auth.uid());
DROP POLICY IF EXISTS "Buyers can update own orders" ON public.orders;
CREATE POLICY "Buyers can update own orders" ON public.orders FOR UPDATE USING (buyer_user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Buyers can read items of own orders" ON public.order_items;
CREATE POLICY "Buyers can read items of own orders" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.buyer_user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Cross-visibility: sellers
DROP POLICY IF EXISTS "Sellers can read items of own products" ON public.order_items;
CREATE POLICY "Sellers can read items of own products" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=public.order_items.product_id AND p.owner_user_id=auth.uid()));

DROP POLICY IF EXISTS "Sellers can read orders with own products" ON public.orders;
CREATE POLICY "Sellers can read orders with own products" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
    WHERE oi.order_id = public.orders.id AND p.owner_user_id = auth.uid()
  )
);

-- Cross-visibility: addresses
DROP POLICY IF EXISTS "Sellers can read addresses of their orders" ON public.addresses;
CREATE POLICY "Sellers can read addresses of their orders" ON public.addresses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products p ON p.id = oi.product_id
    WHERE (o.shipping_address_id = public.addresses.id OR o.billing_address_id = public.addresses.id)
      AND p.owner_user_id = auth.uid()
  )
);

-- ========================================
-- TYPE-SPECIFIC CART ITEMS
-- ========================================

-- Rental cart items (for RENTAL product type)
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

-- Plaster service cart items (for PLASTER_SERVICE product type)
CREATE TABLE IF NOT EXISTS public.plaster_service_cart_items (
  cart_item_id uuid PRIMARY KEY REFERENCES public.cart_items(id) ON DELETE CASCADE,
  custom_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT description_not_empty CHECK (length(trim(custom_description)) > 0)
);

-- ========================================
-- TYPE-SPECIFIC ORDER ITEMS
-- ========================================

-- Rental order items (for RENTAL product type)
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

-- Plaster service order items (for PLASTER_SERVICE product type)
CREATE TABLE IF NOT EXISTS public.plaster_service_order_items (
  order_item_id uuid PRIMARY KEY REFERENCES public.order_items(id) ON DELETE CASCADE,
  custom_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT description_not_empty CHECK (length(trim(custom_description)) > 0)
);

-- RLS
ALTER TABLE public.rental_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaster_service_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaster_service_order_items ENABLE ROW LEVEL SECURITY;

-- Policies: Rental cart items
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

-- Policies: Plaster service cart items
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

-- Policies: Rental order items
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

-- Policies: Plaster service order items
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rental_cart_items_dates ON public.rental_cart_items(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rental_order_items_dates ON public.rental_order_items(start_date, end_date);
