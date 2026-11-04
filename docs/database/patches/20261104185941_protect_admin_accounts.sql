-- Admin accounts can only be changed from the database
-- Date: 2026-11-04
-- Description: From the app, nobody can deactivate an admin and an admin cannot edit
-- another admin's data or profile. Changes made from the SQL Editor (no auth.uid())
-- are still allowed. Replaces the trigger that only protected is_active.

CREATE OR REPLACE FUNCTION public.protect_user_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'only admins can change is_active';
  END IF;

  IF public.is_admin(OLD.id) AND NEW.is_active = false THEN
    RAISE EXCEPTION 'admin accounts cannot be deactivated from the app';
  END IF;

  IF OLD.id <> auth.uid() AND public.is_admin(OLD.id) THEN
    RAISE EXCEPTION 'admin accounts can only be changed from the database';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_user_is_active_change ON public.users;
DROP FUNCTION IF EXISTS public.protect_user_is_active();

DROP TRIGGER IF EXISTS on_user_update_protect ON public.users;
CREATE TRIGGER on_user_update_protect BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_update();

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles FOR UPDATE
USING (public.is_admin(auth.uid()) AND NOT public.is_admin(user_id))
WITH CHECK (public.is_admin(auth.uid()) AND NOT public.is_admin(user_id));
