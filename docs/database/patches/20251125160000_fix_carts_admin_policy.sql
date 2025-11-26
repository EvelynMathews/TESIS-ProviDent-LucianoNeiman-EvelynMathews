-- Fix: Update carts admin policy to use is_admin() helper
-- Date: 2025-11-25
-- Description: Replace direct user_roles query with is_admin() to avoid RLS recursion

DROP POLICY IF EXISTS "Admins can read all carts" ON public.carts;
CREATE POLICY "Admins can read all carts" ON public.carts
  FOR SELECT
  USING (public.is_admin(auth.uid()));
