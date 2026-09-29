-- Admins can edit any product from the admin panel
-- Date: 2026-09-29
-- Description: Product detail tables, product_images and the product-images bucket
-- only allowed owners. Adds the same access for admins (is_admin).

DROP POLICY IF EXISTS "Admins can manage supply products" ON public.supply_products;
CREATE POLICY "Admins can manage supply products" ON public.supply_products FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage prosthesis products" ON public.prosthesis_products;
CREATE POLICY "Admins can manage prosthesis products" ON public.prosthesis_products FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage plaster service products" ON public.plaster_service_products;
CREATE POLICY "Admins can manage plaster service products" ON public.plaster_service_products FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage rental products" ON public.rental_products;
CREATE POLICY "Admins can manage rental products" ON public.rental_products FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage product prices" ON public.product_prices;
CREATE POLICY "Admins can manage product prices" ON public.product_prices FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage rental pricing" ON public.rental_pricing;
CREATE POLICY "Admins can manage rental pricing" ON public.rental_pricing FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Storage: admins can upload/replace images in any seller folder
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));
