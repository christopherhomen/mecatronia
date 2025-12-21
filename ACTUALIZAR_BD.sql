-- SCRIPT FINAL VERIFICADO (Solo Agrega lo que falte)
-- Si alguna columna ya existe, la ignora y sigue. No dará error.

-- 1. Nuevas Columnas de Inventario (Por si faltan)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_documentos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llanta_repuesto boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_plumillas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llave_pernos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_cubre_maletas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_parlantes boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_malla boolean DEFAULT false;

-- 2. Campos de Texto y Firma
ALTER TABLE orders ADD COLUMN IF NOT EXISTS obj_pertenencias text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS solicitud_cliente text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS historial_servicio text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehiculo_km text;

-- 3. EL NUEVO: Fecha Estimada de Entrega
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fecha_entrega text;

SELECT 'Listo. Todo actualizado sin errores.' as mensaje;
