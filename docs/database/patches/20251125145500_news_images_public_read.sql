-- Fix: Allow public to read news images
-- Date: 2025-11-25
-- Description: Add public read policy for news_images table

DROP POLICY IF EXISTS "Public can read news images" ON public.news_images;
CREATE POLICY "Public can read news images" ON public.news_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.news n
      WHERE n.id = news_images.news_id
      AND n.is_published = true
    )
  );
