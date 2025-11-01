-- 01_usuarios_y_roles.sql
-- Core users, profiles, roles and subtypes, triggers and RLS policies

-- Types
DO $$ BEGIN
  CREATE TYPE role_code AS ENUM ('ADMIN','BUYER','SELLER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  first_name text,
  last_name text,
  email text UNIQUE,
  photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  avatar text,
  bio text,
  location text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migrations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_profiles' AND column_name='avatar_url'
  ) THEN
    ALTER TABLE public.user_profiles RENAME COLUMN avatar_url TO avatar;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES public.users(id),
  role role_code NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_buyers (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sellers (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  display_name text,
  rating_avg numeric(3,2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_admins (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Bootstrap trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'BUYER') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_buyers (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Functions
CREATE OR REPLACE FUNCTION public.grant_seller(p_user uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.user_roles(user_id, role) VALUES (p_user, 'SELLER') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_sellers(user_id) VALUES (p_user) ON CONFLICT DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.revoke_seller(p_user uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.user_sellers WHERE user_id = p_user;
  DELETE FROM public.user_roles WHERE user_id = p_user AND role = 'SELLER';
$$;

-- Functions: self-service seller
CREATE OR REPLACE FUNCTION public.grant_seller_self()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles(user_id, role)
  VALUES (auth.uid(), 'SELLER')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_sellers(user_id)
  VALUES (auth.uid())
  ON CONFLICT DO NOTHING;
END
$$;

CREATE OR REPLACE FUNCTION public.grant_admin(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only admins can grant admin';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (p_user, 'ADMIN') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_admins(user_id) VALUES (p_user) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_admin(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only admins can revoke admin';
  END IF;
  DELETE FROM public.user_admins WHERE user_id = p_user;
  DELETE FROM public.user_roles WHERE user_id = p_user AND role = 'ADMIN';
END $$;

-- RLS and policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_admins ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "Users can read own user" ON public.users;
CREATE POLICY "Users can read own user" ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can update own user" ON public.users;
CREATE POLICY "Users can update own user" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));

-- user_profiles
DROP POLICY IF EXISTS "Anyone can read public profiles or own" ON public.user_profiles;
CREATE POLICY "Anyone can read public profiles or own" ON public.user_profiles FOR SELECT USING (is_public OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile" ON public.user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles" ON public.user_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));

-- roles/subtypes
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Users can read own buyer subtype" ON public.user_buyers;
CREATE POLICY "Users can read own buyer subtype" ON public.user_buyers FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all buyers" ON public.user_buyers;
CREATE POLICY "Admins can read all buyers" ON public.user_buyers FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Users can read own seller subtype" ON public.user_sellers;
CREATE POLICY "Users can read own seller subtype" ON public.user_sellers FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all sellers" ON public.user_sellers;
CREATE POLICY "Admins can read all sellers" ON public.user_sellers FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));

DROP POLICY IF EXISTS "Users can read own admin subtype" ON public.user_admins;
CREATE POLICY "Users can read own admin subtype" ON public.user_admins FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own admin subtype" ON public.user_admins;
CREATE POLICY "Users can update own admin subtype" ON public.user_admins FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all admins" ON public.user_admins;
CREATE POLICY "Admins can read all admins" ON public.user_admins FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));
DROP POLICY IF EXISTS "Admins can manage admin subtypes" ON public.user_admins;
CREATE POLICY "Admins can manage admin subtypes" ON public.user_admins FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role='ADMIN'));

-- Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars','avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: read
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND true
);

-- Storage: write
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND position(auth.uid()::text || '/' IN name) = 1
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND position(auth.uid()::text || '/' IN name) = 1
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND position(auth.uid()::text || '/' IN name) = 1
);
