-- Fix: Allow public to read product images of active products
-- Date: 2025-11-25
-- Description: Add public read policy for product_images so buyers can see product images

DROP POLICY IF EXISTS "Public can read product images" ON public.product_images;
CREATE POLICY "Public can read product images" ON public.product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
      AND p.is_active = true
    )
  );
