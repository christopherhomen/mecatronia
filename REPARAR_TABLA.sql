-- SCRIPT DE REPARACIÓN DE EMERGENCIA
-- Este script NO tiene comandos que puedan fallar (como renombrar).
-- Solo agrega lo que falte.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS obj_pertenencias text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS solicitud_cliente text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS historial_servicio text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehiculo_km text;

-- Inventario Nuevo
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_documentos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llanta_repuesto boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_plumillas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_llave_pernos boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_cubre_maletas boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_parlantes boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_malla boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inv_emblemas boolean DEFAULT false;

-- Recargar caché de esquema (Esto ayuda a veces con el error PGRST204)
NOTIFY pgrst, 'reload config';

SELECT 'Reparación completada. Intenta guardar ahora.' as estado;
