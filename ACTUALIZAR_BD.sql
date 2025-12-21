-- SCRIPT MAESTRO DE ACTUALIZACIÓN (TODOS LOS CAMBIOS)
-- Copia y pega TODO esto en Supabase SQL Editor y dale RUN.
-- Si ves errores de "column doesn't exist" en los RENAME, es normal si ya lo corriste antes. IGNÓRALOS.

-- 1. Intentar renombrar columnas viejas (Si falla, ignora esta parte)
ALTER TABLE orders RENAME COLUMN inv_papeles TO inv_documentos;
ALTER TABLE orders RENAME COLUMN inv_repuesto TO inv_llanta_repuesto;

-- 2. Asegurar que existan los NOMBRES NUEVOS (por si el rename falló o no existían)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_documentos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llanta_repuesto boolean DEFAULT false;

-- 3. Nuevos Items de Inventario Agregados recientemente
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_plumillas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llave_pernos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_cubre_maletas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_parlantes boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_malla boolean DEFAULT false;

-- 4. Nuevos Campos de Texto y Firma
ALTER TABLE orders ADD COLUMN IF NOT EXISTS obj_pertenencias text; -- Para objetos personales
ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature text;       -- Para la foto de la firma
ALTER TABLE orders ADD COLUMN IF NOT EXISTS solicitud_cliente text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS historial_servicio text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehiculo_km text;

SELECT 'Base de datos 100% actualizada' as mensaje;
