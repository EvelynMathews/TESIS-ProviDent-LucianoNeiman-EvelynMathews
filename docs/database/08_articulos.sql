-- 08_articulos.sql
-- News and news_images

CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.user_admins(user_id),
  title text NOT NULL,
  slug text UNIQUE,
  preview text,
  content text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id),
  path text NOT NULL,
  alt_text text,
  position integer NOT NULL DEFAULT 1,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT news_images_news_id_position_key UNIQUE (news_id, position)
);

-- RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;

-- Policies: news
DROP POLICY IF EXISTS "Public can read published news" ON public.news;
CREATE POLICY "Public can read published news" ON public.news FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
CREATE POLICY "Admins can manage news" ON public.news FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Policies: news_images
DROP POLICY IF EXISTS "Admins can manage news images" ON public.news_images;
CREATE POLICY "Admins can manage news images" ON public.news_images FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='ADMIN'));

-- Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images','news-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: read
DROP POLICY IF EXISTS "Public can read news images" ON storage.objects;
CREATE POLICY "Public can read news images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'news-images'
  AND true
);

-- Storage: manage
DROP POLICY IF EXISTS "Admins can manage news images (storage)" ON storage.objects;
CREATE POLICY "Admins can manage news images (storage)"
ON storage.objects FOR ALL
USING (
  bucket_id = 'news-images'
  AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'ADMIN')
)
WITH CHECK (
  bucket_id = 'news-images'
  AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'ADMIN')
);
