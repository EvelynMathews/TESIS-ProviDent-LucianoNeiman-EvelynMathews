-- Allow public to read published news
DROP POLICY IF EXISTS "Public can read published news" ON public.news;
CREATE POLICY "Public can read published news" ON public.news
  FOR SELECT
  USING (is_published = true);
