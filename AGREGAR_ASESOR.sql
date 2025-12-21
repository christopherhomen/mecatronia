-- Agrega la columna 'asesor_servicio' a la tabla orders si no existe
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS asesor_servicio TEXT;
