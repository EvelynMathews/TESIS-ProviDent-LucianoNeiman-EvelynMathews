-- Eliminar tabla existente y recrear con nueva estructura
-- ⚠️ ADVERTENCIA: Esto eliminará todos los datos existentes en la tabla addresses

-- Eliminar políticas RLS existentes (si existen)
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

-- Eliminar tabla existente
DROP TABLE IF EXISTS public.addresses CASCADE;

-- Crear tabla con nueva estructura
CREATE TABLE public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  street TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Argentina' NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los usuarios solo pueden ver/editar/eliminar sus propias direcciones
CREATE POLICY "Users can view own addresses"
ON public.addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
ON public.addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON public.addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
ON public.addresses FOR DELETE
USING (auth.uid() = user_id);

-- Índices para optimizar consultas
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_addresses_is_primary ON public.addresses(is_primary) WHERE is_primary = true;

-- Comentarios
COMMENT ON TABLE public.addresses IS 'Direcciones de los usuarios';
COMMENT ON COLUMN public.addresses.is_primary IS 'Indica si es la dirección principal del usuario';
