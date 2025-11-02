-- Types
DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('READY','IN_TRANSIT','DELIVERED','LOST','RETURNED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shipments

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id),
  carrier text,
  service text,
  tracking_code text,
  label_url text,
  shipping_price_charged numeric(12,2),
  shipping_cost_estimated numeric(12,2),
  package_volume_cm3 numeric(12,2),
  status shipment_status NOT NULL DEFAULT 'READY',
  delivered_at timestamptz,
  proof_of_delivery_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Visibility
DROP POLICY IF EXISTS "Sellers can read shipments of own products" ON public.shipments;
CREATE POLICY "Sellers can read shipments of own products" ON public.shipments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
    WHERE oi.id = public.shipments.order_item_id AND p.owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Buyers can read shipments of own orders" ON public.shipments;
CREATE POLICY "Buyers can read shipments of own orders" ON public.shipments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id=oi.order_id
    WHERE oi.id = public.shipments.order_item_id AND o.buyer_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can read all shipments" ON public.shipments;
CREATE POLICY "Admins can read all shipments" ON public.shipments FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: manage (sellers)
DROP POLICY IF EXISTS "Sellers can create shipments of own products" ON public.shipments;
CREATE POLICY "Sellers can create shipments of own products" ON public.shipments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
    WHERE oi.id = public.shipments.order_item_id AND p.owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sellers can update shipments of own products" ON public.shipments;
CREATE POLICY "Sellers can update shipments of own products" ON public.shipments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
    WHERE oi.id = public.shipments.order_item_id AND p.owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sellers can delete shipments of own products" ON public.shipments;
CREATE POLICY "Sellers can delete shipments of own products" ON public.shipments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
    WHERE oi.id = public.shipments.order_item_id AND p.owner_user_id = auth.uid()
  )
);
