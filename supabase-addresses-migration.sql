-- Crear tabla addresses para guardar direcciones de usuarios
CREATE TABLE IF NOT EXISTS public.addresses (
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

-- Crear índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses(user_id);

-- Crear índice para direcciones primarias
CREATE INDEX IF NOT EXISTS addresses_is_primary_idx ON public.addresses(is_primary);

-- RLS: Habilitar Row Level Security
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver sus propias direcciones
CREATE POLICY "Users can view own addresses"
ON public.addresses FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuarios pueden insertar sus propias direcciones
CREATE POLICY "Users can insert own addresses"
ON public.addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuarios pueden actualizar sus propias direcciones
CREATE POLICY "Users can update own addresses"
ON public.addresses FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Usuarios pueden eliminar sus propias direcciones
CREATE POLICY "Users can delete own addresses"
ON public.addresses FOR DELETE
USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER addresses_updated_at_trigger
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_addresses_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.addresses IS 'Direcciones de los usuarios';
COMMENT ON COLUMN public.addresses.user_id IS 'ID del usuario dueño de la dirección';
COMMENT ON COLUMN public.addresses.is_primary IS 'Indica si es la dirección principal del usuario';
