-- Fix: Ensure carts RLS policy is properly applied
-- Date: 2025-11-25
-- Description: Recreate the carts policy to fix 406 errors when querying carts

-- Drop and recreate the policy for carts
DROP POLICY IF EXISTS "Buyers can manage own carts" ON public.carts;
CREATE POLICY "Buyers can manage own carts" ON public.carts
  FOR ALL
  USING (buyer_user_id = auth.uid())
  WITH CHECK (buyer_user_id = auth.uid());
