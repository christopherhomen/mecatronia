-- ⚠️ ADVERTENCIA CRÍTICA ⚠️
-- Este script ELIMINARÁ PERMANENTEMENTE todas las órdenes registradas.
-- Úsalo solo para limpiar la base de datos antes de entregar al cliente.

-- 1. Borrar todos los datos y reiniciar el contador de IDs (orden_numero) a 1
TRUNCATE TABLE public.orders RESTART IDENTITY;

-- Nota: Si tu columna de ID tiene otro nombre de secuencia, el comando anterior suele manejarlo automáticamente.
