-- 03_productos_y_catalogos.sql
-- Materials, work_types, tooth_groups, teeth, products and product subtypes/details

-- Types
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('PROSTHESIS','SIMPLE','PLASTER_SERVICE','RENTAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catalogs
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.work_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.tooth_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.teeth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fdi_code integer NOT NULL UNIQUE,
  tooth_group_id uuid NOT NULL REFERENCES public.tooth_groups(id)
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.user_sellers(user_id),
  name text NOT NULL,
  description text,
  product_type product_type NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  weight_kg numeric(12,3),
  length_cm numeric(12,2),
  width_cm numeric(12,2),
  height_cm numeric(12,2)
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  path text NOT NULL,
  alt_text text,
  position integer NOT NULL DEFAULT 1,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT product_images_product_id_position_key UNIQUE (product_id, position)
);

-- Subtypes and details
CREATE TABLE IF NOT EXISTS public.prosthesis_products (
  product_id uuid PRIMARY KEY REFERENCES public.products(id),
  material_id uuid REFERENCES public.materials(id)
);

CREATE TABLE IF NOT EXISTS public.simple_material_products (
  product_id uuid PRIMARY KEY REFERENCES public.products(id),
  sku text UNIQUE,
  unit_price numeric(12,2) NOT NULL,
  unit_label text NOT NULL,
  stock_qty numeric(12,3)
);

CREATE TABLE IF NOT EXISTS public.plaster_service_products (
  product_id uuid PRIMARY KEY REFERENCES public.products(id),
  base_price numeric(12,2) NOT NULL,
  notes text
);

CREATE TABLE IF NOT EXISTS public.rental_products (
  product_id uuid PRIMARY KEY REFERENCES public.products(id),
  stock_qty integer,
  policy_document_url text,
  refundable_deposit_amount numeric(12,2)
);

CREATE TABLE IF NOT EXISTS public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.prosthesis_products(product_id),
  work_type_id uuid NOT NULL REFERENCES public.work_types(id),
  tooth_group_id uuid NOT NULL REFERENCES public.tooth_groups(id),
  unit_price numeric(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rental_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.rental_products(product_id),
  period interval NOT NULL,
  price numeric(12,2) NOT NULL
);

-- RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tooth_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teeth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prosthesis_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_material_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaster_service_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_pricing ENABLE ROW LEVEL SECURITY;

-- Policies: catalogs
DROP POLICY IF EXISTS "Authenticated users can read materials catalog" ON public.materials;
CREATE POLICY "Authenticated users can read materials catalog" ON public.materials FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage materials catalog" ON public.materials;
CREATE POLICY "Admins can manage materials catalog" ON public.materials FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Authenticated users can read work types catalog" ON public.work_types;
CREATE POLICY "Authenticated users can read work types catalog" ON public.work_types FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage work types catalog" ON public.work_types;
CREATE POLICY "Admins can manage work types catalog" ON public.work_types FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Authenticated users can read tooth groups catalog" ON public.tooth_groups;
CREATE POLICY "Authenticated users can read tooth groups catalog" ON public.tooth_groups FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage tooth groups catalog" ON public.tooth_groups;
CREATE POLICY "Admins can manage tooth groups catalog" ON public.tooth_groups FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Authenticated users can read teeth catalog" ON public.teeth;
CREATE POLICY "Authenticated users can read teeth catalog" ON public.teeth FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage teeth catalog" ON public.teeth;
CREATE POLICY "Admins can manage teeth catalog" ON public.teeth FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: products
DROP POLICY IF EXISTS "Public can read active or owner sees own products" ON public.products;
CREATE POLICY "Public can read active or owner sees own products" ON public.products FOR SELECT USING (is_active OR owner_user_id = auth.uid());
DROP POLICY IF EXISTS "Sellers can create own products" ON public.products;
CREATE POLICY "Sellers can create own products" ON public.products FOR INSERT WITH CHECK (owner_user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_sellers s WHERE s.user_id=auth.uid()));
DROP POLICY IF EXISTS "Owners can update own products" ON public.products;
CREATE POLICY "Owners can update own products" ON public.products FOR UPDATE USING (owner_user_id = auth.uid());

-- Policies: product images
DROP POLICY IF EXISTS "Owners can read product images" ON public.product_images;
CREATE POLICY "Owners can read product images" ON public.product_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins can read all product images" ON public.product_images;
CREATE POLICY "Admins can read all product images" ON public.product_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));
DROP POLICY IF EXISTS "Owners can create product images" ON public.product_images;
CREATE POLICY "Owners can create product images" ON public.product_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));
DROP POLICY IF EXISTS "Owners can update product images" ON public.product_images;
CREATE POLICY "Owners can update product images" ON public.product_images FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));
DROP POLICY IF EXISTS "Owners can delete product images" ON public.product_images;
CREATE POLICY "Owners can delete product images" ON public.product_images FOR DELETE USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));

-- Policies: subtypes and details
DO $$ BEGIN
  -- prosthesis_products
  DROP POLICY IF EXISTS "Anyone can read prosthesis products" ON public.prosthesis_products;
  CREATE POLICY "Anyone can read prosthesis products" ON public.prosthesis_products FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Owners can manage prosthesis products" ON public.prosthesis_products;
  CREATE POLICY "Owners can manage prosthesis products" ON public.prosthesis_products FOR ALL USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));

  -- simple_material_products
  DROP POLICY IF EXISTS "Anyone can read simple material products" ON public.simple_material_products;
  CREATE POLICY "Anyone can read simple material products" ON public.simple_material_products FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Owners can manage simple material products" ON public.simple_material_products;
  CREATE POLICY "Owners can manage simple material products" ON public.simple_material_products FOR ALL USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));

  -- plaster_service_products
  DROP POLICY IF EXISTS "Anyone can read plaster service products" ON public.plaster_service_products;
  CREATE POLICY "Anyone can read plaster service products" ON public.plaster_service_products FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Owners can manage plaster service products" ON public.plaster_service_products;
  CREATE POLICY "Owners can manage plaster service products" ON public.plaster_service_products FOR ALL USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));

  -- rental_products
  DROP POLICY IF EXISTS "Anyone can read rental products" ON public.rental_products;
  CREATE POLICY "Anyone can read rental products" ON public.rental_products FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Owners can manage rental products" ON public.rental_products;
  CREATE POLICY "Owners can manage rental products" ON public.rental_products FOR ALL USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));

  -- product_prices
  DROP POLICY IF EXISTS "Anyone can read product prices" ON public.product_prices;
  CREATE POLICY "Anyone can read product prices" ON public.product_prices FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Owners can manage product prices" ON public.product_prices;
  CREATE POLICY "Owners can manage product prices" ON public.product_prices FOR ALL USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));

  -- rental_pricing
  DROP POLICY IF EXISTS "Anyone can read rental pricing" ON public.rental_pricing;
  CREATE POLICY "Anyone can read rental pricing" ON public.rental_pricing FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Owners can manage rental pricing" ON public.rental_pricing;
  CREATE POLICY "Owners can manage rental pricing" ON public.rental_pricing FOR ALL USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.owner_user_id=auth.uid()));
END $$;

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_product()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  CASE NEW.product_type
    WHEN 'PROSTHESIS' THEN
      INSERT INTO public.prosthesis_products(product_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    WHEN 'SIMPLE' THEN
      INSERT INTO public.simple_material_products(product_id, unit_price, unit_label) VALUES (NEW.id, 0, 'unit') ON CONFLICT DO NOTHING;
    WHEN 'PLASTER_SERVICE' THEN
      INSERT INTO public.plaster_service_products(product_id, base_price) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
    WHEN 'RENTAL' THEN
      INSERT INTO public.rental_products(product_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END CASE;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_product_created ON public.products;
CREATE TRIGGER on_product_created AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_new_product();

CREATE OR REPLACE FUNCTION public.handle_product_type_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.product_type IS DISTINCT FROM OLD.product_type THEN
    DELETE FROM public.prosthesis_products WHERE product_id = NEW.id;
    DELETE FROM public.simple_material_products WHERE product_id = NEW.id;
    DELETE FROM public.plaster_service_products WHERE product_id = NEW.id;
    DELETE FROM public.rental_products WHERE product_id = NEW.id;

    CASE NEW.product_type
      WHEN 'PROSTHESIS' THEN
        INSERT INTO public.prosthesis_products(product_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
      WHEN 'SIMPLE' THEN
        INSERT INTO public.simple_material_products(product_id, unit_price, unit_label) VALUES (NEW.id, 0, 'unit') ON CONFLICT DO NOTHING;
      WHEN 'PLASTER_SERVICE' THEN
        INSERT INTO public.plaster_service_products(product_id, base_price) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
      WHEN 'RENTAL' THEN
        INSERT INTO public.rental_products(product_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    END CASE;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_product_type_changed ON public.products;
CREATE TRIGGER on_product_type_changed AFTER UPDATE OF product_type ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_product_type_change();

CREATE OR REPLACE FUNCTION public.handle_product_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  DELETE FROM public.product_prices WHERE product_id = OLD.id;
  DELETE FROM public.product_shipping_profiles WHERE product_id = OLD.id;
  DELETE FROM public.prosthesis_products WHERE product_id = OLD.id;
  DELETE FROM public.simple_material_products WHERE product_id = OLD.id;
  DELETE FROM public.plaster_service_products WHERE product_id = OLD.id;
  DELETE FROM public.rental_pricing WHERE product_id = OLD.id;
  DELETE FROM public.rental_products WHERE product_id = OLD.id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS on_product_deleted ON public.products;
CREATE TRIGGER on_product_deleted AFTER DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_product_deleted();

-- Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images','product-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: read
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-images'
  AND true
);

-- Storage: write
DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.user_sellers s WHERE s.user_id = auth.uid())
  AND position(auth.uid()::text || '/' IN name) = 1
);

DROP POLICY IF EXISTS "Sellers can update product images" ON storage.objects;
CREATE POLICY "Sellers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.user_sellers s WHERE s.user_id = auth.uid())
  AND position(auth.uid()::text || '/' IN name) = 1
);

DROP POLICY IF EXISTS "Sellers can delete product images" ON storage.objects;
CREATE POLICY "Sellers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.user_sellers s WHERE s.user_id = auth.uid())
  AND position(auth.uid()::text || '/' IN name) = 1
);
