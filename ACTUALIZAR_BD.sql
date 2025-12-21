-- SCRIPT MAESTRO ACTUALIZADO (Con Fecha Entrega)
-- Ejecuta esto en Supabase SQL Editor para asegurar que tengas TODO.

-- 1. Intentar renombrar columnas viejas (Si falla, ignora)
ALTER TABLE orders RENAME COLUMN inv_papeles TO inv_documentos;
ALTER TABLE orders RENAME COLUMN inv_repuesto TO inv_llanta_repuesto;

-- 2. Asegurar Columnas de Inventario
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_documentos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llanta_repuesto boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_plumillas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llave_pernos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_cubre_maletas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_parlantes boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_malla boolean DEFAULT false;

-- 3. Nuevos Campos de Texto y Firma
ALTER TABLE orders ADD COLUMN IF NOT EXISTS obj_pertenencias text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS solicitud_cliente text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS historial_servicio text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehiculo_km text;

-- 4. NUEVO: Fecha Estimada de Entrega (Agregado hoy)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fecha_entrega text;

SELECT 'Base de datos VERIFICADA y ACTUALIZADA' as mensaje;
