-- Add manufacturing_days column to prosthesis_products and plaster_service_products
-- This field stores the number of days required to manufacture/produce the product

-- Add manufacturing_days to prosthesis_products
ALTER TABLE public.prosthesis_products
ADD COLUMN manufacturing_days integer;

-- Add manufacturing_days to plaster_service_products
ALTER TABLE public.plaster_service_products
ADD COLUMN manufacturing_days integer;

COMMENT ON COLUMN public.prosthesis_products.manufacturing_days IS 'Number of days required to manufacture the prosthesis';
COMMENT ON COLUMN public.plaster_service_products.manufacturing_days IS 'Number of days required to prepare the plaster service';
