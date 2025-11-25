-- Remove cover_image_url from news table for consistency with products structure
-- Products use product_images table with path column, so news should use news_images with path too

ALTER TABLE public.news DROP COLUMN IF EXISTS cover_image_url;
